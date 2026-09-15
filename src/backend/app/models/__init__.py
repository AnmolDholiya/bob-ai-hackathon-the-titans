<<<<<<< HEAD
# Import all models so SQLAlchemy registers them with Base.metadata
=======
>>>>>>> 3b90e15 (feat: complete PortMind production integration — AI 72h operational schedule, XGBoost+LightGBM ensemble, CSV ingestion, i18n & command center)
from app.models.port import Port  # noqa: F401
from app.models.berth import Berth  # noqa: F401
from app.models.crane import Crane  # noqa: F401
from app.models.vessel import Vessel  # noqa: F401
<<<<<<< HEAD
=======
from app.models.import_history import ImportHistory  # noqa: F401
from app.models.operator_profile import OperatorProfile  # noqa: F401
from app.models.history import History  # noqa: F401
from app.models.alert import Alert  # noqa: F401
from app.models.notification import Notification  # noqa: F401
>>>>>>> 3b90e15 (feat: complete PortMind production integration — AI 72h operational schedule, XGBoost+LightGBM ensemble, CSV ingestion, i18n & command center)
