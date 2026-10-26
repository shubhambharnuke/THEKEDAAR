"""Institutional Permission Letter PDF Generator using ReportLab"""

import io
from datetime import datetime
from typing import List, Dict, Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable


def generate_permission_letter_pdf(
    letter_id: str,
    event_title: str,
    organizer_name: str,
    organizer_email: str,
    department_name: str,
    department_code: str,
    version_number: int,
    allocated_resources: List[Dict[str, Any]],
    issued_at: datetime,
) -> bytes:
    """
    Generate an institutional monochrome permission letter PDF following DESIGN.md rules:
    - Restrained monochrome styling with thin borders
    - Technical metadata block (Document ID, Version, Timestamp)
    - Tabular breakdown of approved resources and time windows
    - Formal verification footer
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#171717"),
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#70706B"),
        spaceAfter=15,
    )
    section_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#171717"),
        spaceBefore=10,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "BodyTextCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#242424"),
    )
    meta_style = ParagraphStyle(
        "MetaText",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#242424"),
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph("THEKEDAR // INSTITUTIONAL OPERATIONS SYSTEM", subtitle_style))
    story.append(Paragraph("OFFICIAL RESOURCE ALLOCATION PERMISSION LETTER", title_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#171717"), spaceAfter=15))

    # 2. Document Reference Metadata Block
    meta_data = [
        [
            Paragraph("<b>Document Reference:</b>", body_style),
            Paragraph(letter_id, meta_style),
            Paragraph("<b>Version:</b>", body_style),
            Paragraph(f"v{version_number}.0 (Official)", meta_style),
        ],
        [
            Paragraph("<b>Issuing Department:</b>", body_style),
            Paragraph(f"{department_name} [{department_code}]", body_style),
            Paragraph("<b>Issue Timestamp:</b>", body_style),
            Paragraph(issued_at.strftime("%Y-%m-%d %H:%M:%S UTC"), meta_style),
        ],
    ]
    meta_table = Table(meta_data, colWidths=[110, 200, 90, 130])
    meta_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F5F5F2")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#D9D9D4")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D9D9D4")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    story.append(meta_table)
    story.append(Spacer(1, 15))

    # 3. Event Details Section
    story.append(Paragraph("1. EVENT SPECIFICATIONS", section_style))
    event_data = [
        [Paragraph("<b>Event Title:</b>", body_style), Paragraph(event_title, body_style)],
        [Paragraph("<b>Organizer:</b>", body_style), Paragraph(f"{organizer_name} ({organizer_email})", body_style)],
        [Paragraph("<b>Institutional Status:</b>", body_style), Paragraph("OFFICIALLY APPROVED FOR SPECIFIED RESOURCES", body_style)],
    ]
    event_table = Table(event_data, colWidths=[140, 390])
    event_table.setStyle(
        TableStyle([
            ("LINEBELOW", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E5E0")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ])
    )
    story.append(event_table)
    story.append(Spacer(1, 15))

    # 4. Allocated Resources Table
    story.append(Paragraph("2. ALLOCATED CAMPUS RESOURCES & APPROVED TIMINGS", section_style))
    res_table_data = [
        [
            Paragraph("<b>Resource Code</b>", body_style),
            Paragraph("<b>Resource Name</b>", body_style),
            Paragraph("<b>Approved Start (UTC)</b>", body_style),
            Paragraph("<b>Approved End (UTC)</b>", body_style),
        ]
    ]

    for item in allocated_resources:
        res_table_data.append([
            Paragraph(item.get("resource_code", "N/A"), meta_style),
            Paragraph(item.get("resource_name", "N/A"), body_style),
            Paragraph(item.get("start_time", "N/A")[:19], meta_style),
            Paragraph(item.get("end_time", "N/A")[:19], meta_style),
        ])

    res_table = Table(res_table_data, colWidths=[100, 180, 125, 125])
    res_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EAEAE6")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#D9D9D4")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D9D9D4")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(res_table)
    story.append(Spacer(1, 20))

    # 5. Terms & Institutional Notice
    story.append(Paragraph("3. VERIFICATION & OPERATIONAL INSTRUCTIONS", section_style))
    notice_text = (
        "This permission document is digitally signed by the issuing department authority. "
        "Campus Security and facility verifiers can validate document authenticity, cryptographic signatures, "
        "and on-chain Ethereum Sepolia registry state at <b>http://localhost:3000/verify</b> by uploading "
        "this file or querying the Document Reference identifier. Any physical or digital alteration invalidates this authorization."
    )
    story.append(Paragraph(notice_text, body_style))
    story.append(Spacer(1, 25))

    # 6. Authority Signature Block
    sig_data = [
        [
            Paragraph("<b>Digitally Certified By:</b><br/>Department Authority Console", body_style),
            Paragraph("<b>Integrity Status:</b><br/>Cryptographically Signed & Registered", body_style),
        ]
    ]
    sig_table = Table(sig_data, colWidths=[265, 265])
    sig_table.setStyle(
        TableStyle([
            ("LINEABOVE", (0, 0), (-1, 0), 1, colors.HexColor("#171717")),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    story.append(sig_table)

    # Build PDF
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
