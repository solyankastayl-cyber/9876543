"""
Fractal Platform API - Python Proxy to TypeScript Backend
Forwards all /api/* requests to TypeScript Fractal backend running on port 8002
"""
from fastapi import FastAPI, Request, Response, WebSocket
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import httpx
import asyncio
import subprocess
import logging
from pathlib import Path
from contextlib import asynccontextmanager
import websockets

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

TS_BACKEND_URL = "http://127.0.0.1:8002"
ts_process = None

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def start_ts_backend():
    """Start TypeScript backend as subprocess"""
    global ts_process
    logger.info("Starting TypeScript Fractal backend on port 8002...")
    
    env = os.environ.copy()
    env["PORT"] = "8002"
    
    ts_process = subprocess.Popen(
        ["npx", "tsx", "src/app.fractal.ts"],
        cwd="/app/backend",
        env=env,
        stdout=open("/var/log/supervisor/ts_fractal.log", "w"),
        stderr=subprocess.STDOUT
    )
    
    # Wait for TS backend to be ready (max 45 seconds)
    for i in range(45):
        await asyncio.sleep(1)
        try:
            async with httpx.AsyncClient(timeout=2.0) as http_client:
                resp = await http_client.get(f"{TS_BACKEND_URL}/api/health")
                if resp.status_code == 200:
                    logger.info(f"TypeScript backend ready after {i+1}s")
                    return True
        except:
            if i % 10 == 9:
                logger.info(f"Still waiting for TS backend... ({i+1}s)")
    
    logger.warning("TypeScript backend may not be fully ready")
    return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await start_ts_backend()
    yield
    # Shutdown
    global ts_process
    if ts_process:
        ts_process.terminate()
        try:
            ts_process.wait(timeout=5)
        except:
            ts_process.kill()
    client.close()

app = FastAPI(title="Fractal Platform", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Direct health endpoint
@app.get("/api/health")
async def health():
    ts_status = None
    try:
        async with httpx.AsyncClient(timeout=3.0) as http_client:
            resp = await http_client.get(f"{TS_BACKEND_URL}/api/health")
            ts_status = resp.json() if resp.status_code == 200 else {"error": resp.status_code}
    except Exception as e:
        ts_status = {"error": str(e)}
    
    return {
        "status": "ok",
        "proxy": "python",
        "ts_backend": ts_status
    }

# Proxy all API routes to TypeScript
@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_api(path: str, request: Request):
    url = f"{TS_BACKEND_URL}/api/{path}"
    
    # Add query params
    if request.query_params:
        url = f"{url}?{request.query_params}"
    
    # Get headers
    headers = {k: v for k, v in request.headers.items() 
               if k.lower() not in ('host', 'content-length', 'transfer-encoding')}
    
    # Get body
    body = None
    if request.method in ("POST", "PUT", "PATCH"):
        body = await request.body()
    
    try:
        async with httpx.AsyncClient(timeout=300.0) as http_client:
            response = await http_client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body
            )
            
            # Filter response headers
            resp_headers = {}
            for k, v in response.headers.items():
                if k.lower() not in ('content-encoding', 'transfer-encoding', 'content-length'):
                    resp_headers[k] = v
            
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=resp_headers,
                media_type=response.headers.get('content-type')
            )
    except httpx.ConnectError:
        return JSONResponse(
            {"error": "TypeScript backend unavailable", "url": url},
            status_code=503
        )
    except Exception as e:
        return JSONResponse(
            {"error": "Proxy error", "detail": str(e)},
            status_code=500
        )

# WebSocket proxy to TypeScript backend
@app.websocket("/api/ws")
async def websocket_proxy_api(websocket: WebSocket):
    await websocket.accept()
    try:
        async with websockets.connect(f"ws://127.0.0.1:8002/api/ws") as ws_backend:
            async def forward_to_backend():
                try:
                    async for message in websocket.iter_text():
                        await ws_backend.send(message)
                except Exception:
                    pass
                    
            async def forward_to_client():
                try:
                    async for message in ws_backend:
                        await websocket.send_text(message)
                except Exception:
                    pass
            
            await asyncio.gather(forward_to_backend(), forward_to_client())
    except Exception as e:
        logger.warning(f"WebSocket proxy error: {e}")
    finally:
        try:
            await websocket.close()
        except:
            pass

@app.websocket("/ws")
async def websocket_proxy_root(websocket: WebSocket):
    await websocket.accept()
    try:
        async with websockets.connect(f"ws://127.0.0.1:8002/ws") as ws_backend:
            async def forward_to_backend():
                try:
                    async for message in websocket.iter_text():
                        await ws_backend.send(message)
                except Exception:
                    pass
                    
            async def forward_to_client():
                try:
                    async for message in ws_backend:
                        await websocket.send_text(message)
                except Exception:
                    pass
            
            await asyncio.gather(forward_to_backend(), forward_to_client())
    except Exception as e:
        logger.warning(f"WebSocket proxy error: {e}")
    finally:
        try:
            await websocket.close()
        except:
            pass

# Root redirect
@app.get("/")
async def root():
    return {"message": "Fractal Platform API", "docs": "/docs"}
