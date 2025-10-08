import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from decouple import config
import ssl

# ----------------- ENVIRONMENT CONFIG -----------------
ENVIRONMENT = config("ENVIRONMENT", default="dev").lower()

if ENVIRONMENT == "dev":
    # ===== Development: MailHog =====
    SMTP_HOST = config("SMTP_HOST", default="localhost")
    SMTP_PORT = int(config("SMTP_PORT", default=1025))
    SMTP_USER = config("SMTP_USER", default="")
    SMTP_PASS = config("SMTP_PASS", default="")
    DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="admin@local.dev")
else:
    # ===== Production: Gmail SMTP =====
    SMTP_HOST = config("SMTP_HOST_PROD", default="smtp.gmail.com")
    SMTP_PORT = int(config("SMTP_PORT_PROD", default=587))
    SMTP_USER = config("SMTP_USER_PROD", default="krithickt.18@gmail.com")
    SMTP_PASS = config("SMTP_PASS_PROD", default="")  # Gmail App Password required in prod
    DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL_PROD", default=SMTP_USER)


# ----------------- GENERIC EMAIL FUNCTION -----------------
def send_email(subject: str, recipients: list[str], body: str):
    """
    Send an email through MailHog (dev) or Gmail SMTP (prod).
    """
    try:
        msg = MIMEMultipart()
        msg["From"] = DEFAULT_FROM_EMAIL
        msg["To"] = ", ".join(recipients)
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html"))

        if ENVIRONMENT == "dev":
            # Local MailHog - capture emails
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
                server.send_message(msg)
                print(f"[DEV] Email captured by MailHog for {recipients}")
        else:
            # Gmail SMTP - real send
            if not SMTP_USER or not SMTP_PASS:
                print("❌ Email disabled: SMTP_USER_PROD/SMTP_PASS_PROD missing. Skipping send.")
                return
            context = ssl.create_default_context()
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                server.ehlo()
                server.starttls(context=context)
                server.ehlo()
                server.login(SMTP_USER, SMTP_PASS)
                server.send_message(msg)
                print(f"[PROD] Email sent to {recipients}")

    except Exception as e:
        print(f"❌ Email send error to {recipients}: {e}")


# ----------------- TASK EMAILS -----------------
def send_task_assigned_email(member_email: str, project_name: str, task_title: str, assigned_by: str):
    """
    Notify user when a new task is assigned.
    """
    subject = f"New Task Assigned in {project_name}"
    body = f"""
    <h3>New Task Assigned</h3>
    <p><b>Task:</b> {task_title}</p>
    <p><b>Project:</b> {project_name}</p>
    <p><b>Assigned By:</b> {assigned_by}</p>
    <br>
    <p>Login to your dashboard to view details.</p>
    """
    send_email(subject, [member_email], body)


def send_task_status_update_email(
    recipients: list[str],
    project_name: str,
    task_title: str,
    new_status: str,
    updated_by: str,
):
    """
    Notify team when a task status is updated.
    """
    subject = f"Task Status Updated in {project_name}"
    body = f"""
    <h3>Task Status Updated</h3>
    <p><b>Task:</b> {task_title}</p>
    <p><b>New Status:</b> {new_status}</p>
    <p><b>Updated By:</b> {updated_by}</p>
    <br>
    <p>Login to your dashboard for details.</p>
    """
    send_email(subject, recipients, body)
