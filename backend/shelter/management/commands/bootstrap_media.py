from pathlib import Path
import shutil

from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Copia los archivos media incluidos en el repositorio hacia MEDIA_ROOT si aun no existen."

    def handle(self, *args, **options):
        source_root = Path(settings.BASE_DIR) / "media"
        target_root = Path(settings.MEDIA_ROOT)

        if not source_root.exists():
            self.stdout.write("No hay media embebido para copiar.")
            return

        copied = 0
        for source_path in source_root.rglob("*"):
            if not source_path.is_file():
                continue

            relative_path = source_path.relative_to(source_root)
            target_path = target_root / relative_path
            target_path.parent.mkdir(parents=True, exist_ok=True)

            if target_path.exists():
                continue

            shutil.copy2(source_path, target_path)
            copied += 1

        self.stdout.write(self.style.SUCCESS(f"Bootstrap de media completado. Archivos copiados: {copied}"))
