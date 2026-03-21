"""
WebSocket endpoints for real-time alert delivery.

Flood Resilience System - Real-time alert push notifications
via WebSocket connections.
"""

import json
import logging
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status as ws_status
from pydantic import BaseModel

router = APIRouter(prefix="/ws", tags=["WebSocket"])
logger = logging.getLogger(__name__)


class AlertMessage(BaseModel):
    """Real-time alert message structure."""
    type: str
    data: dict[str, Any]


class ConnectionManager:
    """Manages WebSocket connections and broadcasting."""
    
    def __init__(self) -> None:
        """Initialize the connection manager with empty connections list."""
        self.active_connections: list[WebSocket] = []
        logger.info("ConnectionManager initialized")

    async def connect(self, websocket: WebSocket) -> None:
        """
        Accept a WebSocket connection and add it to active connections.
        
        Args:
            websocket: The WebSocket connection to accept
        """
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        """
        Remove a disconnected WebSocket from active connections.
        
        Args:
            websocket: The WebSocket connection to remove
        """
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict[str, Any]) -> None:
        """
        Broadcast a message to all connected clients.
        
        Handles disconnections gracefully by removing stale connections.
        
        Args:
            message: The message dictionary to broadcast
        """
        disconnected_clients = []
        
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as exc:
                logger.warning(f"Failed to send message to client: {exc}")
                disconnected_clients.append(connection)
        
        # Clean up disconnected clients
        for client in disconnected_clients:
            self.disconnect(client)

    async def send_personal(
        self,
        websocket: WebSocket,
        message: dict[str, Any],
    ) -> bool:
        """
        Send a message to a specific client.
        
        Args:
            websocket: The WebSocket connection to send to
            message: The message dictionary to send
            
        Returns:
            True if successful, False if connection failed
        """
        try:
            await websocket.send_json(message)
            return True
        except Exception as exc:
            logger.warning(f"Failed to send personal message: {exc}")
            self.disconnect(websocket)
            return False


# Global connection manager instance
alert_manager = ConnectionManager()


@router.websocket("/alerts")
async def alerts_websocket(websocket: WebSocket) -> None:
    """
    WebSocket endpoint for real-time emergency alerts.
    
    Clients connect here to receive push notifications of:
    - New emergency alerts (critical, high priority)
    - Weather warnings
    - Shelter availability changes
    - System notifications
    
    Connection flow:
    1. Client connects to ws://127.0.0.1:8000/api/v1/ws/alerts
    2. Server accepts and adds to active connections
    3. Client can receive_text() to keep connection alive (optional)
    4. Server broadcasts alerts via broadcast() method
    5. Client or server closes connection
    
    Message format received from server:
    ```json
    {
        "type": "new_alert",
        "data": {
            "id": "alert-uuid",
            "title": "Flood Warning",
            "severity": "CRITICAL",
            "description": "...",
            "created_at": "2026-03-21T12:34:56Z"
        }
    }
    ```
    """
    await alert_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive by waiting for incoming messages
            # (clients send heartbeats or we close on real disconnect)
            data = await websocket.receive_text()
            # Optional: log heartbeats or handle client messages
            logger.debug(f"Received message from client: {data[:100]}")
    except WebSocketDisconnect:
        alert_manager.disconnect(websocket)
        logger.info("WebSocket alert client disconnected normally")
    except Exception as exc:
        alert_manager.disconnect(websocket)
        logger.error(f"WebSocket alert error: {exc}")
