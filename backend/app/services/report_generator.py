import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from sqlalchemy.orm import Session

from app.models.all_models import Assessment, Worker, QualificationPack, ReviewDecision
from app.services.scoring_engine import scoring_engine

class PDFReportGenerator:
    def generate_assessment_report(self, db: Session, assessment_id: str) -> bytes:
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
        if not assessment:
            raise ValueError("Assessment not found")

        worker = db.query(Worker).filter(Worker.id == assessment.worker_id).first()
        qp = db.query(QualificationPack).filter(QualificationPack.id == assessment.qp_id).first()
        review = db.query(ReviewDecision).filter(ReviewDecision.assessment_id == assessment_id).order_by(ReviewDecision.created_at.desc()).first()
        scoring_summary = scoring_engine.calculate_scoring(db, assessment_id)

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        styles = getSampleStyleSheet()
        
        # Custom Styles
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#0F172A'), # Navy
            alignment=0,
            spaceAfter=4
        )
        
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            leading=12,
            textColor=colors.HexColor('#475569'),
            spaceAfter=12
        )
        
        heading2_style = ParagraphStyle(
            'SectionHeader',
            parent=styles['Heading2'],
            fontSize=12,
            leading=15,
            textColor=colors.HexColor('#1E3A8A'), # Dark Blue
            spaceBefore=10,
            spaceAfter=6
        )

        body_style = ParagraphStyle(
            'BodyTextCustom',
            parent=styles['BodyText'],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#334155')
        )
        
        disclaimer_style = ParagraphStyle(
            'DisclaimerStyle',
            parent=styles['Italic'],
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#64748B')
        )

        elements = []

        # Header Title
        elements.append(Paragraph("SKILLBRIDGE RPL ASSESSMENT & COMPETENCY PROFILE", title_style))
        elements.append(Paragraph("Ministry of Skill Development & Entrepreneurship (MSDE) - Recognition of Prior Learning", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#1E3A8A'), spaceAfter=12))

        # Basic Info Table
        info_data = [
            [
                Paragraph("<b>Report ID:</b>", body_style), Paragraph(f"RPL-REP-{assessment.id[:8].upper()}", body_style),
                Paragraph("<b>Assessment Date:</b>", body_style), Paragraph(datetime.utcnow().strftime("%Y-%m-%d"), body_style)
            ],
            [
                Paragraph("<b>Worker Name:</b>", body_style), Paragraph(worker.full_name if worker else "N/A", body_style),
                Paragraph("<b>Trade / Sector:</b>", body_style), Paragraph(worker.trade if worker else "N/A", body_style)
            ],
            [
                Paragraph("<b>Qualification Pack:</b>", body_style), Paragraph(f"{qp.title} ({qp.qp_code})", body_style),
                Paragraph("<b>NSQF Level:</b>", body_style), Paragraph(f"Level {qp.nsqf_level} (v{qp.version})", body_style)
            ],
            [
                Paragraph("<b>Assessor ID:</b>", body_style), Paragraph(assessment.assessor_id or "System Assigned", body_style),
                Paragraph("<b>Status:</b>", body_style), Paragraph(assessment.status.upper(), body_style)
            ]
        ]

        t_info = Table(info_data, colWidths=[100, 170, 110, 160])
        t_info.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t_info)
        elements.append(Spacer(1, 10))

        # Summary Section
        elements.append(Paragraph("Assessment Score Summary", heading2_style))
        summary_data = [
            [Paragraph("<b>Overall Score</b>", body_style), Paragraph("<b>Status</b>", body_style), Paragraph("<b>Recommendation</b>", body_style)],
            [
                Paragraph(f"<font size=14 color='#1E3A8A'><b>{scoring_summary.overall_percentage}%</b></font> ({scoring_summary.overall_score}/{scoring_summary.overall_max})", body_style),
                Paragraph(f"<b>{assessment.status.upper()}</b>", body_style),
                Paragraph(f"<b>{scoring_summary.recommendation}</b>", body_style)
            ]
        ]
        t_sum = Table(summary_data, colWidths=[140, 100, 300])
        t_sum.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#EFF6FF')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t_sum)
        elements.append(Spacer(1, 10))

        # Competency Breakdown Table
        elements.append(Paragraph("Competency Unit (NOS) Performance", heading2_style))
        comp_rows = [[Paragraph("<b>NOS Code</b>", body_style), Paragraph("<b>Title</b>", body_style), Paragraph("<b>Score</b>", body_style), Paragraph("<b>Result</b>", body_style)]]
        
        for cs in scoring_summary.competency_summaries:
            status_text = "<font color='green'><b>PASS</b></font>" if cs.passed else "<font color='red'><b>FAIL</b></font>"
            comp_rows.append([
                Paragraph(cs.nos_code, body_style),
                Paragraph(cs.title, body_style),
                Paragraph(f"{cs.achieved_score}/{cs.max_score} ({cs.percentage}%)", body_style),
                Paragraph(status_text, body_style)
            ])

        t_comp = Table(comp_rows, colWidths=[90, 250, 110, 90])
        t_comp.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('PADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(t_comp)
        elements.append(Spacer(1, 10))

        # Reviewer Decision if exists
        if review:
            elements.append(Paragraph("Human Reviewer Authorization", heading2_style))
            rev_data = [
                [Paragraph("<b>Decision:</b>", body_style), Paragraph(review.decision.upper(), body_style)],
                [Paragraph("<b>Reviewer Notes:</b>", body_style), Paragraph(review.decision_reason, body_style)],
                [Paragraph("<b>Timestamp:</b>", body_style), Paragraph(review.created_at.strftime("%Y-%m-%d %H:%M UTC"), body_style)]
            ]
            t_rev = Table(rev_data, colWidths=[110, 430])
            t_rev.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
                ('PADDING', (0,0), (-1,-1), 5),
            ]))
            elements.append(t_rev)
            elements.append(Spacer(1, 10))

        # Regulatory & System Disclaimer
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#94A3B8'), spaceBefore=10, spaceAfter=8))
        disclaimer_text = (
            "<b>LEGAL & CERTIFICATION DISCLAIMER:</b> This document represents an AI-assisted Recognition of Prior Learning (RPL) assessment recommendation. "
            "It assists authorized assessors in evaluating practical prior skills. It is NOT an official NCVET certificate and does not automatically grant official certification. "
            "Final certification requires verification and issue by an accredited Assessment Agency & Awarding Body under MSDE guidelines."
        )
        elements.append(Paragraph(disclaimer_text, disclaimer_style))

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

pdf_report_generator = PDFReportGenerator()
