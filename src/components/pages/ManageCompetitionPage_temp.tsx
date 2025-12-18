// Додаткові функції для завантаження протоколу
const downloadProtocolPDF = async () => {
    try {
        const { jsPDF } = await import('jspdf');
        
        const doc = new jsPDF();
        doc.setFont('helvetica');
        
        let yPos = 20;
        doc.setFontSize(16);
        doc.text('PROTOKOL ZMAHAN', 105, yPos, { align: 'center' });
        yPos += 10;
        
        doc.setFontSize(14);
        doc.text(competition?.name || '', 105, yPos, { align: 'center' });
        yPos += 8;
        
        doc.setFontSize(10);
        doc.text(`Data: ${competition?.date ? new Date(competition.date).toLocaleDateString('uk-UA') : ''}`, 20, yPos);
        yPos += 6;
        doc.text(`Misce: ${competition?.location || ''}`, 20, yPos);
        yPos += 15;
        
        const groups: Record<string, ExtendedParticipant[]> = {};
        participants.forEach(p => {
            if (p.status !== 'confirmed') return;
            if (p.category && p.class) {
                const key = `${p.category} - ${p.class}`;
                if (!groups[key]) groups[key] = [];
                groups[key].push(p);
            }
        });
        
        Object.keys(groups).forEach(groupName => {
            const groupParticipants = groups[groupName];
            groupParticipants.sort((a, b) => (a.results?.place || 999) - (b.results?.place || 999));
            
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }
            
            doc.setFontSize(12);
            doc.text(groupName, 20, yPos);
            yPos += 8;
            
            doc.setFontSize(9);
            doc.text('#', 20, yPos);
            doc.text('Uchasnyk', 30, yPos);
            doc.text('Sobaka', 80, yPos);
            doc.text('Poshuk', 120, yPos);
            doc.text('Poslukh', 145, yPos);
            doc.text('Baly', 170, yPos);
            yPos += 6;
            
            groupParticipants.forEach(p => {
                if (yPos > 280) {
                    doc.addPage();
                    yPos = 20;
                }
                
                const place = p.results?.place ? String(p.results.place) : '-';
                const search = p.results?.search ? p.results.search.toFixed(1) : '-';
                const obedience = p.results?.obedience ? p.results.obedience.toFixed(1) : '-';
                const total = p.results?.total ? p.results.total.toFixed(1) : '-';
                
                doc.text(place, 20, yPos);
                doc.text(p.userName.substring(0, 20), 30, yPos);
                doc.text(p.dogName.substring(0, 15), 80, yPos);
                doc.text(search, 120, yPos);
                doc.text(obedience, 145, yPos);
                doc.text(total, 170, yPos);
                yPos += 6;
            });
            
            yPos += 10;
        });
        
        yPos += 20;
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
        doc.text('Holovnyy suddya: _____________________', 20, yPos);
        yPos += 10;
        doc.text('Sekretar: _____________________', 20, yPos);
        
        doc.save(`protocol_${competition?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
        showToast('Протокол PDF завантажено!', 'success');
    } catch (error) {
        console.error('Error generating PDF:', error);
        showToast('Помилка генерації PDF', 'error');
    }
};

const downloadProtocolDOCX = async () => {
    try {
        const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } = await import('docx');
        
        const groups: Record<string, ExtendedParticipant[]> = {};
        participants.forEach(p => {
            if (p.status !== 'confirmed') return;
            if (p.category && p.class) {
                const key = `${p.category} - ${p.class}`;
                if (!groups[key]) groups[key] = [];
                groups[key].push(p);
            }
        });
        
        const sections: any[] = [];
        
        sections.push(
            new Paragraph({
                text: 'ПРОТОКОЛ ЗМАГАНЬ',
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
            })
        );
        
        sections.push(
            new Paragraph({
                text: competition?.name || '',
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
            })
        );
        
        sections.push(
            new Paragraph({
                text: `Дата: ${competition?.date ? new Date(competition.date).toLocaleDateString('uk-UA') : ''}`,
                spacing: { after: 100 },
            })
        );
        
        sections.push(
            new Paragraph({
                text: `Місце проведення: ${competition?.location || ''}`,
                spacing: { after: 400 },
            })
        );
        
        Object.keys(groups).forEach(groupName => {
            const groupParticipants = groups[groupName];
            groupParticipants.sort((a, b) => (a.results?.place || 999) - (b.results?.place || 999));
            
            sections.push(
                new Paragraph({
                    text: groupName,
                    spacing: { before: 300, after: 200 },
                })
            );
            
            const tableRows = [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph('#')] }),
                        new TableCell({ children: [new Paragraph('Учасник')] }),
                        new TableCell({ children: [new Paragraph('Собака')] }),
                        new TableCell({ children: [new Paragraph('Пошук')] }),
                        new TableCell({ children: [new Paragraph('Послух')] }),
                        new TableCell({ children: [new Paragraph('Бали')] }),
                        new TableCell({ children: [new Paragraph('Оцінка')] }),
                    ],
                }),
            ];
            
            groupParticipants.forEach(p => {
                const place = p.results?.place ? String(p.results.place) : '-';
                const search = p.results?.search ? p.results.search.toFixed(1) : '-';
                const obedience = p.results?.obedience ? p.results.obedience.toFixed(1) : '-';
                const total = p.results?.total ? p.results.total.toFixed(1) : '-';
                const qual = p.results?.qualification || '-';
                
                tableRows.push(
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph(place)] }),
                            new TableCell({ children: [new Paragraph(p.userName)] }),
                            new TableCell({ children: [new Paragraph(p.dogName)] }),
                            new TableCell({ children: [new Paragraph(search)] }),
                            new TableCell({ children: [new Paragraph(obedience)] }),
                            new TableCell({ children: [new Paragraph(total)] }),
                            new TableCell({ children: [new Paragraph(qual)] }),
                        ],
                    })
                );
            });
            
            sections.push(
                new Table({
                    rows: tableRows,
                    width: { size: 100, type: WidthType.PERCENTAGE },
                })
            );
        });
        
        sections.push(
            new Paragraph({
                text: '',
                spacing: { before: 600 },
            })
        );
        
        sections.push(
            new Paragraph({
                text: 'Головний суддя: _____________________',
                spacing: { after: 300 },
            })
        );
        
        sections.push(
            new Paragraph({
                text: 'Секретар: _____________________',
            })
        );
        
        const doc = new Document({
            sections: [{
                children: sections,
            }],
        });
        
        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `protocol_${competition?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast('Протокол DOCX завантажено!', 'success');
    } catch (error) {
        console.error('Error generating DOCX:', error);
        showToast('Помилка генерації DOCX', 'error');
    }
};
