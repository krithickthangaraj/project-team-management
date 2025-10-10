import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from decouple import config
import ssl
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from datetime import datetime
import logging

# ----------------- ENVIRONMENT CONFIG -----------------
ENVIRONMENT = config("ENVIRONMENT", default="dev").lower()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if ENVIRONMENT == "dev":
    # ===== Development: MailHog =====
    SMTP_HOST = config("SMTP_HOST", default="localhost")
    SMTP_PORT = int(config("SMTP_PORT", default=1025))
    SMTP_USER = config("SMTP_USER", default="")
    SMTP_PASS = config("SMTP_PASS", default="")
    DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="admin@local.dev")
    FROM_NAME = "Project Team Management (Dev)"
else:
    # ===== Production: SendGrid =====
    SENDGRID_API_KEY = config("SENDGRID_API_KEY", default="")
    DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL_PROD", default="krithickt.22it@kongu.edu")
    FROM_NAME = "Project Team Management"
    
    # Validate SendGrid configuration
    if not SENDGRID_API_KEY:
        logger.warning("⚠️  SENDGRID_API_KEY not found. Email functionality will be disabled.")
    else:
        logger.info("✅ SendGrid API key configured successfully")


# ----------------- EMAIL TEMPLATE HELPERS -----------------
def get_email_footer():
    """Get professional email footer"""
    return """
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <p><strong>Project Team Management System</strong></p>
        <p>This is an automated notification. Please do not reply to this email.</p>
        <p>For support, contact your project administrator.</p>
        <p style="font-size: 12px; color: #9ca3af;">Sent on {}</p>
    </div>
    """.format(datetime.now().strftime("%B %d, %Y at %I:%M %p"))

def get_email_header(title: str):
    """Get professional email header"""
    return f"""
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 600;">{title}</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Project Team Management System</p>
    </div>
    <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
    """

# ----------------- GENERIC EMAIL FUNCTION -----------------
def send_email(subject: str, recipients: list[str], body: str, email_type: str = "notification"):
    """
    Send a professional email through MailHog (dev) or SendGrid (prod).
    """
    if not recipients:
        logger.warning("No recipients provided for email")
        return False
        
    logger.info(f"📧 Sending {email_type} email to {len(recipients)} recipient(s)")
    logger.info(f"📧 Recipients: {', '.join(recipients)}")
    logger.info(f"📧 Environment: {ENVIRONMENT}")
    
    # Create professional email template
    full_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
        {get_email_header("Project Team Management")}
        {body}
        {get_email_footer()}
        </div>
    </body>
    </html>
    """
    
    try:
        if ENVIRONMENT == "dev":
            # Local MailHog - capture emails
            msg = MIMEMultipart()
            msg["From"] = f"{FROM_NAME} <{DEFAULT_FROM_EMAIL}>"
            msg["To"] = ", ".join(recipients)
            msg["Subject"] = subject
            msg.attach(MIMEText(full_body, "html"))
            
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
                server.send_message(msg)
                logger.info(f"✅ [DEV] Email captured by MailHog for {recipients}")
                return True
        else:
            # Production: SendGrid
            if not SENDGRID_API_KEY:
                logger.error("❌ Email disabled: SENDGRID_API_KEY missing. Skipping send.")
                return False
                
            logger.info("📧 Using SendGrid for production email")
            sg = SendGridAPIClient(api_key=SENDGRID_API_KEY)
            
            success_count = 0
            for recipient in recipients:
                try:
                    message = Mail(
                        from_email=(DEFAULT_FROM_EMAIL, FROM_NAME),
                        to_emails=recipient,
                        subject=subject,
                        html_content=full_body
                    )
                    
                    response = sg.send(message)
                    if response.status_code in [200, 201, 202]:
                        logger.info(f"✅ [PROD] Email sent successfully to {recipient} (Status: {response.status_code})")
                        success_count += 1
                    else:
                        logger.error(f"❌ [PROD] Failed to send email to {recipient} (Status: {response.status_code})")
                        
                except Exception as e:
                    logger.error(f"❌ [PROD] Error sending email to {recipient}: {e}")
            
            logger.info(f"📧 Email delivery summary: {success_count}/{len(recipients)} successful")
            return success_count > 0

    except smtplib.SMTPException as e:
        logger.error(f"❌ SMTP error: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Email send error to {recipients}: {e}")
        logger.error(f"❌ Error type: {type(e).__name__}")
        return False


# ----------------- TASK EMAILS -----------------
def send_task_assigned_email(member_email: str, project_name: str, task_title: str, assigned_by: str, task_description: str = ""):
    """
    Notify user when a new task is assigned with professional email template.
    """
    logger.info(f"📧 Sending task assignment email to {member_email}")
    
    subject = f"🎯 New Task Assigned: {task_title}"
    
    body = f"""
    <div style="background: white; padding: 0;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">🎯 New Task Assignment</h2>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin-top: 0;">Task Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #4b5563; width: 120px;">Task:</td>
                    <td style="padding: 8px 0; color: #1f2937;">{task_title}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #4b5563;">Project:</td>
                    <td style="padding: 8px 0; color: #1f2937;">{project_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #4b5563;">Assigned By:</td>
                    <td style="padding: 8px 0; color: #1f2937;">{assigned_by}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #4b5563;">Status:</td>
                    <td style="padding: 8px 0;"><span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">IN PROGRESS</span></td>
                </tr>
            </table>
        </div>
        
        {f'<div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 20px;"><h4 style="margin-top: 0; color: #374151;">Description:</h4><p style="margin: 0; color: #6b7280;">{task_description}</p></div>' if task_description else ''}
        
        <div style="background: #dbeafe; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <h4 style="margin-top: 0; color: #1e40af;">📋 Next Steps</h4>
            <ul style="margin: 0; color: #1e40af;">
                <li>Review the task requirements and description</li>
                <li>Update the task status as you work on it</li>
                <li>Contact your project owner if you have any questions</li>
                <li>Mark the task as completed when finished</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View Task in Dashboard</a>
        </div>
    </div>
    """
    
    return send_email(subject, [member_email], body, "task_assignment")


def send_task_status_update_email(
    recipients: list[str],
    project_name: str,
    task_title: str,
    new_status: str,
    updated_by: str,
    previous_status: str = ""
):
    """
    Notify team when a task status is updated with professional email template.
    """
    logger.info(f"📧 Sending task status update email to {len(recipients)} recipient(s)")
    
    status_colors = {
        "incomplete": ("#ef4444", "INCOMPLETE"),
        "in_progress": ("#f59e0b", "IN PROGRESS"), 
        "completed": ("#10b981", "COMPLETED")
    }
    
    color, status_text = status_colors.get(new_status.lower(), ("#6b7280", new_status.upper()))
    
    subject = f"📊 Task Status Updated: {task_title}"
    
    body = f"""
    <div style="background: white; padding: 0;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">📊 Task Status Update</h2>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin-top: 0;">Update Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #4b5563; width: 120px;">Task:</td>
                    <td style="padding: 8px 0; color: #1f2937;">{task_title}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #4b5563;">Project:</td>
                    <td style="padding: 8px 0; color: #1f2937;">{project_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #4b5563;">New Status:</td>
                    <td style="padding: 8px 0;"><span style="background: {color}20; color: {color}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">{status_text}</span></td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #4b5563;">Updated By:</td>
                    <td style="padding: 8px 0; color: #1f2937;">{updated_by}</td>
                </tr>
                {f'<tr><td style="padding: 8px 0; font-weight: 600; color: #4b5563;">Previous Status:</td><td style="padding: 8px 0; color: #6b7280;">{previous_status.title()}</td></tr>' if previous_status else ''}
            </table>
        </div>
        
        <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <h4 style="margin-top: 0; color: #0369a1;">💡 What This Means</h4>
            <p style="margin: 0; color: #0369a1;">
                {f"The task has been marked as {status_text.lower()}. " if new_status.lower() == "completed" else f"The task is now {status_text.lower()}. "}
                {"Great work on completing this task!" if new_status.lower() == "completed" else "Keep up the good work!"}
            </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View Project Dashboard</a>
        </div>
    </div>
    """
    
    return send_email(subject, recipients, body, "status_update")


def send_team_member_added_email(member_email: str, team_name: str, project_name: str, added_by: str):
    """
    Notify user when they are added to a team.
    """
    logger.info(f"📧 Sending team member added email to {member_email}")
    
    subject = f"👥 Welcome to Team: {team_name}"
    
    body = f"""
    <div style="background: white; padding: 0;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">👥 Team Membership</h2>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin-top: 0;">Team Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #4b5563; width: 120px;">Team:</td>
                    <td style="padding: 8px 0; color: #1f2937;">{team_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #4b5563;">Project:</td>
                    <td style="padding: 8px 0; color: #1f2937;">{project_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #4b5563;">Added By:</td>
                    <td style="padding: 8px 0; color: #1f2937;">{added_by}</td>
                </tr>
            </table>
        </div>
        
        <div style="background: #ecfdf5; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <h4 style="margin-top: 0; color: #065f46;">🎉 Welcome to the Team!</h4>
            <p style="margin: 0; color: #065f46;">
                You've been added to the <strong>{team_name}</strong> team for the <strong>{project_name}</strong> project. 
                You can now collaborate with your team members and work on assigned tasks.
            </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View Team Dashboard</a>
        </div>
    </div>
    """
    
    return send_email(subject, [member_email], body, "team_membership")
