import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import BackgroundTasks

# Real Gmail credentials
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "krithickt.18@gmail.com"
SENDER_PASSWORD = "YOUR_APP_PASSWORD_HERE"  # <-- Replace this with your 16-char app password


def send_email(subject: str, body: str, recipients: list[str]):
    """Send an email via Gmail SMTP"""
    try:
        # Setup MIME
        message = MIMEMultipart()
        message["From"] = SENDER_EMAIL
        message["To"] = ", ".join(recipients)
        message["Subject"] = subject

        message.attach(MIMEText(body, "html"))

        # Connect to Gmail
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(message)
            print(f"[MAIL] Email sent successfully to: {recipients}")
    except Exception as e:
        print(f"[MAIL ERROR] {e}")


def send_task_assigned_email(member_email: str, project_name: str, task_title: str, assigned_by: str):
    subject = f"New Task Assigned in {project_name}"
    body = f"""
    <h3>New Task Assigned</h3>
    <p><b>Task:</b> {task_title}</p>
    <p><b>Project:</b> {project_name}</p>
    <p><b>Assigned By:</b> {assigned_by}</p>
    <br>
    <p>Login to your dashboard to view details.</p>
    """
    send_email(subject, body, [member_email])


def send_task_status_update_email(recipients: list[str], project_name: str, task_title: str, new_status: str, updated_by: str):
    subject = f"Task Status Updated in {project_name}"
    body = f"""
    <h3>Task Status Updated</h3>
    <p><b>Task:</b> {task_title}</p>
    <p><b>New Status:</b> {new_status}</p>
    <p><b>Updated By:</b> {updated_by}</p>
    <br>
    <p>Login to your dashboard for details.</p>
    """
    send_email(subject, body, recipients)
