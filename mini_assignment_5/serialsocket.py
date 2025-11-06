import serial
import asyncio
import websockets

SERIAL_PORT = 'COM7'  # Adjust for your system
BAUD_RATE = 9600

async def serial_to_websocket(websocket):
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    print(f"Connected to serial port: {SERIAL_PORT}")

    try:
        while True:
            # Read from serial and send to WebSocket
            if ser.in_waiting > 0:
                data = ser.readline().decode('utf-8').strip()
                await websocket.send(data)
                print(f"Sent to P5.js: {data}")

            # Receive from WebSocket and send to serial
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=0.1)
                ser.write(message.encode('utf-8'))
                print(f"Received from P5.js and sent to serial: {message}")
            except asyncio.TimeoutError:
                pass # No message received from WebSocket

            await asyncio.sleep(0.01) # Small delay to prevent busy-waiting

    except websockets.exceptions.ConnectionClosedOK:
        print("P5.js client disconnected.")
    finally:
        ser.close()
        print("Serial port closed.")

async def main():
    print(f"connecting to WebSocket server")
    async with websockets.serve(serial_to_websocket, "localhost", 8765):
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())