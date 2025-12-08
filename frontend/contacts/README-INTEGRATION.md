Integration guide — Frontend (Angular) <-> Backend (Django DRF)

Summary
- Frontend: `d:\projects\crud\frontend\contacts` (Angular workspace)
- Backend: `d:\projects\crud\backend\netsutra` (Django project)

What the integration does
- Frontend `ContactService` calls the DRF endpoints at `http://127.0.0.1:8000/api/contacts/`.
- Backend exposes the API at `/api/contacts/` via a DRF DefaultRouter.
- CORS is enabled in `settings.py` for development so the browser can call the API.

Steps to run locally (Windows cmd.exe)

1) Backend: install Python deps and run the server

   cd /d D:\projects\crud\backend\netsutra
   python -m pip install -r requirements.txt
   python manage.py makemigrations
   python manage.py migrate
   python manage.py runserver

2) Frontend: install node deps and run dev server

   cd /d D:\projects\crud\frontend\contacts
   npm install
   npx ng serve --open

3) Verify

   - Open the Django browsable API: http://127.0.0.1:8000/api/contacts/
   - Open the Angular app: http://localhost:4200/ — it should show the contacts UI and load data from the API.

Troubleshooting

- CORS errors in browser: ensure `django-cors-headers` is installed and `corsheaders.middleware.CorsMiddleware` is listed at the top of `MIDDLEWARE` in `settings.py`. I configured `CORS_ALLOW_ALL_ORIGINS = True` for development.
- Missing Python packages: run `python -m pip install -r requirements.txt` in the backend folder.
- Angular compile errors about missing @angular packages: run `npm install` in the frontend folder.
- If you prefer not to enable CORS globally, use Angular proxy instead. Create `proxy.conf.json` in the Angular project and run `ng serve --proxy-config proxy.conf.json`.

Notes
- The backend model defines `email = models.URLField(...)`; if you intended an email address field, change it to `models.EmailField(...)` and run migrations.
- The DRF viewset currently permits anonymous access (AllowAny). Authenticate before deploying to production.
