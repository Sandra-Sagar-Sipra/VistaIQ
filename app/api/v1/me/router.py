from fastapi import APIRouter, Depends, status

from app.auth.dependencies import get_current_user
from app.models.user import AppUser
from app.schemas.me import MeResponse

router = APIRouter(prefix="/api/v1/me", tags=["Me"])


@router.get(
    "",
    response_model=MeResponse,
    status_code=status.HTTP_200_OK,
    summary="Get the signed-in user",
    description=(
        "Returns the user resolved from the bearer token. The account is created "
        "automatically on first sign-in. Requires a valid Entra ID access token "
        "carrying the api://<client-id>/access_as_user scope."
    ),
    responses={
        status.HTTP_401_UNAUTHORIZED: {"description": "Missing, expired or invalid token"},
        status.HTTP_503_SERVICE_UNAVAILABLE: {"description": "Entra could not be reached"},
    },
)
async def read_me(user: AppUser = Depends(get_current_user)) -> MeResponse:
    return MeResponse.model_validate(user)
