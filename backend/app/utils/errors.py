from fastapi import HTTPException, status


class AIServiceException(HTTPException):
    def __init__(self, detail: str = "AI service is currently unavailable. Please check if local AI service (Ollama) is running and the configured model is installed."):
        super().__init__(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail)


class CredentialsException(HTTPException):
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )
