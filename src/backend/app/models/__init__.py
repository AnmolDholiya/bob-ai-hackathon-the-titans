# Import all models so SQLAlchemy registers them with Base.metadata
from app.models.port import Port  # noqa: F401
from app.models.berth import Berth  # noqa: F401
from app.models.crane import Crane  # noqa: F401
from app.models.vessel import Vessel  # noqa: F401
