from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Hello, Project Team Management System!"}
