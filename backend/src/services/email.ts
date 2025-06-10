import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || "re_ZfjBSaRX_5JQ6QW1cEfkh5KixjTwkr464")

export const sendInvitationEmail = async (
  email: string,
  boardTitle: string,
  token: string,
  inviterName: string
) => {
  try {
    const acceptUrl = `${process.env.CLIENT_URL}/accept-invite/${token}`

    console.log(`Sending invitation email to ${email} for board "${boardTitle}" invited by ${inviterName} with token ${token}`);

    console.log("Accept URL:", acceptUrl);
    
    
    
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'KanbanFlow <noreply@kanbanflow.com>',
      to: email,
      subject: `You've been invited to join "${boardTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">You're invited to collaborate!</h2>
          
          <p>Hi there,</p>
          
          <p><strong>${inviterName}</strong> has invited you to collaborate on the board "<strong>${boardTitle}</strong>" on KanbanFlow.</p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${acceptUrl}" 
               style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This invitation will expire in 7 days. If you can't click the button above, copy and paste this link into your browser:
          </p>
          
          <p style="color: #666; font-size: 14px; word-break: break-all;">
            ${acceptUrl}
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="color: #999; font-size: 12px;">
            You received this email because someone invited you to collaborate on KanbanFlow. 
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `
    })
  } catch (error) {
    console.error('Email sending failed:', error)
    throw error
  }
}