import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from decouple import config
import ssl
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

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
    # ===== Production: SendGrid =====
    SENDGRID_API_KEY = config("SENDGRID_API_KEY", default="")
    DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL_PROD", default="krithickt.18@gmail.com")


# ----------------- GENERIC EMAIL FUNCTION -----------------
def send_email(subject: str, recipients: list[str], body: str):
    """
    Send an email through MailHog (dev) or SendGrid (prod).
    """
    print(f"[EMAIL DEBUG] Attempting to send email to {recipients}")
    print(f"[EMAIL DEBUG] Environment: {ENVIRONMENT}")
    
    try:
        if ENVIRONMENT == "dev":
            # Local MailHog - capture emails
            msg = MIMEMultipart()
            msg["From"] = DEFAULT_FROM_EMAIL
            msg["To"] = ", ".join(recipients)
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "html"))
            
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
                server.send_message(msg)
                print(f"[DEV] Email captured by MailHog for {recipients}")
        else:
            # Production: SendGrid
            if not SENDGRID_API_KEY:
                print("❌ Email disabled: SENDGRID_API_KEY missing. Skipping send.")
                return
                
            print(f"[EMAIL DEBUG] Using SendGrid for production email")
            sg = SendGridAPIClient(api_key=SENDGRID_API_KEY)
            
            for recipient in recipients:
                message = Mail(
                    from_email=DEFAULT_FROM_EMAIL,
                    to_emails=recipient,
                    subject=subject,
                    html_content=body
                )
                
                response = sg.send(message)
                print(f"[PROD] Email sent successfully to {recipient} via SendGrid (Status: {response.status_code})")

    except smtplib.SMTPException as e:
        print(f"❌ SMTP error: {e}")
    except Exception as e:
        print(f"❌ Email send error to {recipients}: {e}")
        print(f"[EMAIL DEBUG] Error type: {type(e).__name__}")


# ----------------- TASK EMAILS -----------------
def send_task_assigned_email(member_email: str, project_name: str, task_title: str, assigned_by: str):
    """
    Notify user when a new task is assigned.
    """
    print(f"[EMAIL DEBUG] send_task_assigned_email called for {member_email}")
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
