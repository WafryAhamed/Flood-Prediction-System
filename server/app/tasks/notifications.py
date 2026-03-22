"""
Notification delivery background tasks.
"""
import logging
from uuid import UUID
from datetime import datetime

from celery import shared_task
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import async_session_maker
from app.models.alerts import (
    Broadcast,
    BroadcastTarget,
    BroadcastStatus,
    NotificationDelivery,
    ChannelType,
    DeliveryStatus,
    DeviceToken,
    UserNotificationPreference,
)
from app.models.auth import User
from app.models.gis import District, RiskZone


logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def deliver_broadcast(self, broadcast_id: str) -> dict:
    """
    Deliver a broadcast to all targeted users.
    
    This task:
    1. Loads the broadcast and its targets
    2. Identifies all users in targeted districts/zones
    3. Creates NotificationDelivery records for each channel
    4. Dispatches to individual channel delivery tasks
    """
    import asyncio
    return asyncio.get_event_loop().run_until_complete(
        _deliver_broadcast_async(broadcast_id)
    )


async def _deliver_broadcast_async(broadcast_id: str) -> dict:
    """Async implementation of broadcast delivery."""
    async with async_session_maker() as db:
        # Load broadcast with targets
        query = (
            select(Broadcast)
            .where(Broadcast.id == UUID(broadcast_id))
            .options(selectinload(Broadcast.targets))
        )
        result = await db.execute(query)
        broadcast = result.scalar_one_or_none()
        
        if broadcast is None:
            logger.error(f"Broadcast {broadcast_id} not found")
            return {"error": "Broadcast not found"}
        
        if broadcast.status != BroadcastStatus.PUBLISHED:
            logger.warning(f"Broadcast {broadcast_id} is not published")
            return {"error": "Broadcast not published"}
        
        # Get target district IDs
        target_district_ids = [t.district_id for t in broadcast.targets if t.district_id]
        target_zone_ids = [t.zone_id for t in broadcast.targets if t.zone_id]
        
        # Find active users in targeted areas
        from app.models.auth import UserStatus
        user_query = select(User).where(User.status == UserStatus.ACTIVE)
        
        if target_district_ids:
            user_query = user_query.where(User.district_id.in_(target_district_ids))
        
        user_result = await db.execute(user_query)
        users = user_result.scalars().all()
        
        # Create delivery records for each user/channel
        deliveries_created = 0
        for user in users:
            # Check user notification preferences
            pref_query = select(UserNotificationPreference).where(
                UserNotificationPreference.user_id == user.id
            )
            pref_result = await db.execute(pref_query)
            prefs = pref_result.scalar_one_or_none()
            
            for channel in broadcast.channels:
                # Check if user wants this channel
                if prefs:
                    if channel == ChannelType.PUSH and not prefs.push_enabled:
                        continue
                    if channel == ChannelType.SMS and not prefs.sms_enabled:
                        continue
                    if channel == ChannelType.EMAIL and not prefs.email_enabled:
                        continue
                    if channel == ChannelType.IN_APP and not prefs.in_app_enabled:
                        continue
                
                delivery = NotificationDelivery(
                    broadcast_id=broadcast.id,
                    user_id=user.id,
                    channel=channel,
                    status=DeliveryStatus.PENDING,
                )
                db.add(delivery)
                deliveries_created += 1
        
        await db.commit()
        
        # Dispatch to channel-specific tasks
        for channel in broadcast.channels:
            if channel == ChannelType.PUSH:
                deliver_push_notifications.delay(broadcast_id)
            elif channel == ChannelType.SMS:
                deliver_sms_notifications.delay(broadcast_id)
            elif channel == ChannelType.EMAIL:
                deliver_email_notifications.delay(broadcast_id)
        
        logger.info(f"Created {deliveries_created} delivery records for broadcast {broadcast_id}")
        
        return {
            "broadcast_id": broadcast_id,
            "deliveries_created": deliveries_created,
            "channels": [c.value for c in broadcast.channels],
        }


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def deliver_push_notifications(self, broadcast_id: str) -> dict:
    """
    Deliver push notifications for a broadcast.
    
    Integrates with FCM (Firebase Cloud Messaging) or similar service.
    """
    import asyncio
    return asyncio.get_event_loop().run_until_complete(
        _deliver_push_async(broadcast_id)
    )


async def _deliver_push_async(broadcast_id: str) -> dict:
    """Async implementation of push notification delivery."""
    async with async_session_maker() as db:
        # Get pending push deliveries
        query = (
            select(NotificationDelivery)
            .where(
                NotificationDelivery.broadcast_id == UUID(broadcast_id),
                NotificationDelivery.channel == ChannelType.PUSH,
                NotificationDelivery.status == DeliveryStatus.PENDING,
            )
        )
        result = await db.execute(query)
        deliveries = result.scalars().all()
        
        # Load broadcast for content
        broadcast_result = await db.execute(
            select(Broadcast).where(Broadcast.id == UUID(broadcast_id))
        )
        broadcast = broadcast_result.scalar_one_or_none()
        
        if not broadcast:
            return {"error": "Broadcast not found"}
        
        delivered = 0
        failed = 0
        
        for delivery in deliveries:
            # Get user's device tokens
            token_query = select(DeviceToken).where(
                DeviceToken.user_id == delivery.user_id,
                DeviceToken.is_active == True,
            )
            token_result = await db.execute(token_query)
            device_tokens = token_result.scalars().all()
            
            if not device_tokens:
                delivery.status = DeliveryStatus.FAILED
                delivery.error_message = "No active device tokens"
                failed += 1
                continue
            
            # In production, send to FCM/APNs here
            # For now, simulate success
            try:
                # Example FCM integration:
                # from firebase_admin import messaging
                # for token in device_tokens:
                #     message = messaging.Message(
                #         notification=messaging.Notification(
                #             title=broadcast.title_en,
                #             body=broadcast.message_en,
                #         ),
                #         token=token.token,
                #     )
                #     messaging.send(message)
                
                delivery.status = DeliveryStatus.DELIVERED
                delivery.delivered_at = datetime.utcnow()
                delivered += 1
                
            except Exception as e:
                delivery.status = DeliveryStatus.FAILED
                delivery.error_message = str(e)
                failed += 1
        
        await db.commit()
        
        return {
            "broadcast_id": broadcast_id,
            "delivered": delivered,
            "failed": failed,
        }


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def deliver_sms_notifications(self, broadcast_id: str) -> dict:
    """
    Deliver SMS notifications for a broadcast.
    
    Integrates with SMS gateway (Twilio, Dialog, etc.).
    """
    import asyncio
    return asyncio.get_event_loop().run_until_complete(
        _deliver_sms_async(broadcast_id)
    )


async def _deliver_sms_async(broadcast_id: str) -> dict:
    """Async implementation of SMS delivery."""
    async with async_session_maker() as db:
        # Get pending SMS deliveries with user info
        query = (
            select(NotificationDelivery)
            .where(
                NotificationDelivery.broadcast_id == UUID(broadcast_id),
                NotificationDelivery.channel == ChannelType.SMS,
                NotificationDelivery.status == DeliveryStatus.PENDING,
            )
        )
        result = await db.execute(query)
        deliveries = result.scalars().all()
        
        # Load broadcast
        broadcast_result = await db.execute(
            select(Broadcast).where(Broadcast.id == UUID(broadcast_id))
        )
        broadcast = broadcast_result.scalar_one_or_none()
        
        if not broadcast:
            return {"error": "Broadcast not found"}
        
        delivered = 0
        failed = 0
        
        for delivery in deliveries:
            # Get user's phone
            user_result = await db.execute(
                select(User).where(User.id == delivery.user_id)
            )
            user = user_result.scalar_one_or_none()
            
            if not user or not user.phone_number:
                delivery.status = DeliveryStatus.FAILED
                delivery.error_message = "No phone number"
                failed += 1
                continue
            
            # In production, send via SMS gateway
            try:
                # Construct message based on user's language
                if user.preferred_language == "si" and broadcast.message_si:
                    message = broadcast.message_si
                elif user.preferred_language == "ta" and broadcast.message_ta:
                    message = broadcast.message_ta
                else:
                    message = broadcast.message_en
                
                # Example Twilio integration:
                # from twilio.rest import Client
                # client = Client(TWILIO_SID, TWILIO_TOKEN)
                # client.messages.create(
                #     body=message,
                #     from_=TWILIO_PHONE,
                #     to=user.phone_number,
                # )
                
                delivery.status = DeliveryStatus.DELIVERED
                delivery.delivered_at = datetime.utcnow()
                delivered += 1
                
            except Exception as e:
                delivery.status = DeliveryStatus.FAILED
                delivery.error_message = str(e)
                failed += 1
        
        await db.commit()
        
        return {
            "broadcast_id": broadcast_id,
            "delivered": delivered,
            "failed": failed,
        }


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def deliver_email_notifications(self, broadcast_id: str) -> dict:
    """
    Deliver email notifications for a broadcast.
    """
    import asyncio
    return asyncio.get_event_loop().run_until_complete(
        _deliver_email_async(broadcast_id)
    )


async def _deliver_email_async(broadcast_id: str) -> dict:
    """Async implementation of email delivery."""
    async with async_session_maker() as db:
        query = (
            select(NotificationDelivery)
            .where(
                NotificationDelivery.broadcast_id == UUID(broadcast_id),
                NotificationDelivery.channel == ChannelType.EMAIL,
                NotificationDelivery.status == DeliveryStatus.PENDING,
            )
        )
        result = await db.execute(query)
        deliveries = result.scalars().all()
        
        broadcast_result = await db.execute(
            select(Broadcast).where(Broadcast.id == UUID(broadcast_id))
        )
        broadcast = broadcast_result.scalar_one_or_none()
        
        if not broadcast:
            return {"error": "Broadcast not found"}
        
        delivered = 0
        failed = 0
        
        for delivery in deliveries:
            user_result = await db.execute(
                select(User).where(User.id == delivery.user_id)
            )
            user = user_result.scalar_one_or_none()
            
            if not user or not user.email:
                delivery.status = DeliveryStatus.FAILED
                delivery.error_message = "No email address"
                failed += 1
                continue
            
            try:
                # In production, send via email service (SendGrid, SES, etc.)
                # import sendgrid
                # sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_KEY)
                # ...
                
                delivery.status = DeliveryStatus.DELIVERED
                delivery.delivered_at = datetime.utcnow()
                delivered += 1
                
            except Exception as e:
                delivery.status = DeliveryStatus.FAILED
                delivery.error_message = str(e)
                failed += 1
        
        await db.commit()
        
        return {
            "broadcast_id": broadcast_id,
            "delivered": delivered,
            "failed": failed,
        }


@shared_task
def send_emergency_contact_alert(user_id: str, alert_message: str) -> dict:
    """
    Send alerts to a user's emergency contacts.
    
    Triggered when a user activates emergency mode.
    """
    import asyncio
    return asyncio.get_event_loop().run_until_complete(
        _send_emergency_alert_async(user_id, alert_message)
    )


async def _send_emergency_alert_async(user_id: str, alert_message: str) -> dict:
    """Async implementation of emergency contact alerting."""
    from app.models.alerts import EmergencyContact
    
    async with async_session_maker() as db:
        # Get user's emergency contacts
        query = (
            select(EmergencyContact)
            .where(
                EmergencyContact.user_id == UUID(user_id),
                EmergencyContact.notify_on_emergency == True,
            )
            .order_by(EmergencyContact.priority)
        )
        result = await db.execute(query)
        contacts = result.scalars().all()
        
        # Get user info
        user_result = await db.execute(
            select(User).where(User.id == UUID(user_id))
        )
        user = user_result.scalar_one_or_none()
        
        if not user:
            return {"error": "User not found"}
        
        notified = 0
        for contact in contacts:
            try:
                # Send SMS to emergency contact
                message = f"EMERGENCY: {user.full_name} has activated emergency mode. {alert_message}"
                
                # In production, send via SMS gateway
                # ...
                
                notified += 1
                
            except Exception as e:
                logger.error(f"Failed to notify emergency contact {contact.name}: {e}")
        
        return {
            "user_id": user_id,
            "contacts_notified": notified,
        }
