from fastapi import FastAPI
from routers import (
    current_user,
    user_managament,
    screen_management,
    product_management,
    shelf_management,
)
from fastapi.middleware.cors import CORSMiddleware


###For removing passlib warning
import logging

logging.getLogger("passlib").setLevel(logging.ERROR)
###


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(current_user.router)
app.include_router(user_managament.router)
app.include_router(screen_management.router)
app.include_router(product_management.router)
app.include_router(shelf_management.router)


# if __name__ == "__main__":
#     create_db_and_tables()
#     uvicorn.run(app, host="0.0.0.0", port=8000)

# to run the server (cd supermarket_backend) and then use (uvicorn main:app --reload --port 8000)
