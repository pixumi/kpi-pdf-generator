document.addEventListener('DOMContentLoaded', function() {
    // --- VARIABEL GLOBAL ---
    let currentActiveRow = 1;
    
    // --- MANAJEMEN NAMA FILE PDF ---
    const fileCounterState = {
        lastDate: '',
        counter: 0
    };

    // --- Fungsi untuk generate nama file ---
    function generateFilename() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear().toString().slice(-2);
        const currentDateString = `${day}${month}${year}`;

        const docTypeSelect = document.getElementById('kpi-type');
        const documentType = docTypeSelect ? docTypeSelect.value : "VALIDATION";

        if (currentDateString === fileCounterState.lastDate) {
            fileCounterState.counter++;
        } else {
            fileCounterState.lastDate = currentDateString;
            fileCounterState.counter = 1;
        }

        const formattedDocType = documentType.replace(/ /g, '_');
        const filename = `${fileCounterState.lastDate}-${fileCounterState.counter}_${formattedDocType}.pdf`;
        
        return filename;
    }

    // --- FUNGSI PEMROSESAN INPUT BARU ---
    function processInputValue(value, forRightLayout = false) {
        if (value === null || value === undefined) return '';
        
        let processed = value.toString();
        
        // Hanya ganti quotes untuk layout kanan
        if (forRightLayout) {
            processed = processed
                .replace(/"""{1,2}/g, ' INCH')
                .replace(/""/g, ' INCH')
                .replace(/"/g, '')
                .replace(/;/g, ' ')
                .replace(/; /g, '');
        }
        
        processed = processed.toUpperCase();
        processed = processed.replace(/\s{2,}/g, ' ');
        
        return processed;
    }

    // --- FUNGSI TAB SIMULTAN ---
    const allTabs = document.querySelectorAll('.tab-link');
    const allTabContents = document.querySelectorAll('.tab-content');
    allTabs.forEach(clickedTab => {
        clickedTab.addEventListener('click', () => {
            let baseTargetId = clickedTab.dataset.tab;
            if (baseTargetId.endsWith('_2')) {
                baseTargetId = baseTargetId.slice(0, -2);
            }
            allTabs.forEach(tab => tab.classList.remove('active'));
            allTabContents.forEach(content => content.classList.remove('active'));
            const targetTab1 = document.querySelector(`.tab-link[data-tab="${baseTargetId}"]`);
            const targetTab2 = document.querySelector(`.tab-link[data-tab="${baseTargetId}_2"]`);
            if (targetTab1) targetTab1.classList.add('active');
            if (targetTab2) targetTab2.classList.add('active');
            const targetContent1 = document.getElementById(baseTargetId);
            const targetContent2 = document.getElementById(`${baseTargetId}_2`);
            if (targetContent1) targetContent1.classList.add('active');
            if (targetContent2) targetContent2.classList.add('active');
        });
    });

    // --- FUNGSI INPUT TABEL ---
    const gridContainer = document.querySelector('.table-input-grid');
    const transferBtn = document.getElementById('transfer-data-btn');

    // Fungsi untuk menerapkan data dari baris tertentu
    function applyTableData(row = 1) {
        try {
            // Ambil nilai mentah tanpa pemrosesan quotes
            const materialVal = document.getElementById(`table-material-${row}`).value;
            const descriptionVal = document.getElementById(`table-description-${row}`).value;
            const partNumberVal = document.getElementById(`table-partnumber-${row}`).value;
            const uomVal = document.getElementById(`table-uom-${row}`).value;
            const matTypeVal = document.getElementById(`table-mattype-${row}`).value;
            const matGroupVal = document.getElementById(`table-matgroup-${row}`).value;

            // Layout kiri (Before) - tanpa penggantian quotes
            document.getElementById('material').value = processInputValue(materialVal);
            document.getElementById('description').value = processInputValue(descriptionVal);
            document.getElementById('base-unit').value = processInputValue(uomVal);
            document.getElementById('material-group').value = processInputValue(matGroupVal);
            document.getElementById('mfr-part-number').value = processInputValue(partNumberVal);

            // Layout kanan (After) - dengan penggantian quotes
            document.getElementById('material_2').value = processInputValue(materialVal, true);
            document.getElementById('description_2').value = processInputValue(descriptionVal, true);
            document.getElementById('base-unit_2').value = processInputValue(uomVal, true);
            document.getElementById('material-group_2').value = processInputValue(matGroupVal, true);
            document.getElementById('mfr-part-number_2').value = processInputValue(partNumberVal, true);

            // Highlight baris yang aktif
            highlightActiveRow(row);
            currentActiveRow = row;

            if (transferBtn) {
                transferBtn.textContent = `Data Row ${row} Applied!`;
                setTimeout(() => {
                    transferBtn.textContent = 'Apply Data to Layout';
                }, 1500);
            }
        } catch (error) {
            console.error("Error in applyTableData:", error);
            alert("Terjadi kesalahan saat menerapkan data. Pastikan semua field ada.");
        }
    }

    // Fungsi untuk highlight baris aktif
    function highlightActiveRow(row) {
        document.querySelectorAll('.row-input').forEach(input => {
            input.classList.remove('active-row');
        });

        document.querySelectorAll(`.row-input[data-row="${row}"]`).forEach(input => {
            input.classList.add('active-row');
        });
    }

    // Event listener untuk tombol transfer data
    if (transferBtn) {
        transferBtn.addEventListener('click', () => {
            applyTableData(currentActiveRow);
        });
    }

    // Event listener untuk input field (deteksi baris aktif)
    document.querySelectorAll('.row-input').forEach(input => {
        input.addEventListener('focus', function() {
            const row = this.dataset.row;
            currentActiveRow = parseInt(row);
            highlightActiveRow(currentActiveRow);
        });
    });

    // Fungsi paste dari Excel untuk 25 baris
    if (gridContainer) {
        gridContainer.addEventListener('paste', function(event) {
            event.preventDefault();
            const pastedText = (event.clipboardData || window.clipboardData).getData('text');
            const rows = pastedText.split('\n').map(row => row.split('\t'));

            // Loop untuk setiap baris yang dipaste (maks 25 baris)
            for (let i = 0; i < Math.min(rows.length, 25); i++) {
                const rowData = rows[i];
                if (rowData.length >= 1) { // Minimal ada 1 kolom
                    // Isi input dengan ID yang sesuai
                    if (document.getElementById(`table-material-${i+1}`)) {
                        document.getElementById(`table-material-${i+1}`).value = rowData[0] || '';
                        document.getElementById(`table-description-${i+1}`).value = rowData[1] || '';
                        document.getElementById(`table-partnumber-${i+1}`).value = rowData[2] || '';
                        document.getElementById(`table-uom-${i+1}`).value = rowData[3] || '';
                        document.getElementById(`table-mattype-${i+1}`).value = rowData[4] || '';
                        document.getElementById(`table-matgroup-${i+1}`).value = rowData[5] || '';

                        // Highlight baris
                        const rowNum = i + 1;
                        document.querySelectorAll(`.row-input[data-row="${rowNum}"]`).forEach(input => {
                            input.classList.add('highlight-row');
                            setTimeout(() => input.classList.remove('highlight-row'), 1500);
                        });
                    }
                }
            }

            // Set baris pertama sebagai aktif setelah paste
            currentActiveRow = 1;
            highlightActiveRow(currentActiveRow);
        });
    }

    // --- FUNGSI MEMBUAT PDF ---
    const pdfBtn = document.getElementById('create-pdf-btn');
    const allPdfsBtn = document.getElementById('create-all-pdfs-btn');

    // Fungsi untuk membuat PDF dari baris tertentu
    async function createPdfForRow(row) {
        const { jsPDF } = window.jspdf;

        applyTableData(row);
        await new Promise(resolve => setTimeout(resolve, 300));

        const content = document.getElementById('pdf-content');
        const canvas = await html2canvas(content, {
            scale: 1,
            useCORS: true,
            backgroundColor: '#FFFFFF',
            logging: false
        });

        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'legal',
            compress: true
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = canvas.height / canvas.width;
        const imgWidth = pdfWidth - 20;
        const imgHeight = imgWidth * ratio;

        pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
        pdf.save(generateFilename());
        return true;
    }

    // Handler untuk tombol Create Current PDF
    if (pdfBtn) {
        pdfBtn.addEventListener('click', async function() {
            const originalText = this.textContent;
            this.textContent = 'Creating PDF...';
            this.disabled = true;

            try {
                await createPdfForRow(currentActiveRow);
                this.textContent = 'PDF Created!';
                setTimeout(() => {
                    this.textContent = originalText;
                    this.disabled = false;
                }, 1500);
            } catch (err) {
                console.error("PDF creation failed:", err);
                this.textContent = 'Error Creating PDF';
                setTimeout(() => {
                    this.textContent = originalText;
                    this.disabled = false;
                }, 1500);
            }
        });
    }

    // Handler untuk tombol Create All PDFs
    if (allPdfsBtn) {
        allPdfsBtn.addEventListener('click', async function() {
            const originalText = this.textContent;
            this.textContent = 'Creating PDFs...';
            this.disabled = true;

            try {
                for (let i = 1; i <= 25; i++) {
                    const materialInput = document.getElementById(`table-material-${i}`);
                    if (!materialInput) continue;
                    
                    const materialVal = materialInput.value;
                    if (!materialVal.trim()) continue;

                    await createPdfForRow(i);
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                this.textContent = 'All PDFs Created!';
                setTimeout(() => {
                    this.textContent = originalText;
                    this.disabled = false;
                }, 2000);
            } catch (err) {
                console.error("PDF creation failed:", err);
                this.textContent = 'Error Creating PDFs';
                setTimeout(() => {
                    this.textContent = originalText;
                    this.disabled = false;
                }, 2000);
            }
        });
    }

    // Inisialisasi data-row untuk semua input
    function initializeRowDataAttributes() {
        for (let row = 1; row <= 25; row++) {
            const inputs = [
                document.getElementById(`table-material-${row}`),
                document.getElementById(`table-description-${row}`),
                document.getElementById(`table-partnumber-${row}`),
                document.getElementById(`table-uom-${row}`),
                document.getElementById(`table-mattype-${row}`),
                document.getElementById(`table-matgroup-${row}`)
            ];
            
            inputs.forEach(input => {
                if (input) input.dataset.row = row;
            });
        }
    }

    // --- INISIALISASI AWAL ---
    initializeRowDataAttributes();
    highlightActiveRow(1);
});

