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

        // PERBAIKAN: Menggunakan ID 'kpi-type' yang sesuai dengan HTML
        const docTypeSelect = document.getElementById('kpi-type');
        const documentType = docTypeSelect ? docTypeSelect.value : "VALIDATION";

        // Perbarui counter berdasarkan tanggal
        if (currentDateString === fileCounterState.lastDate) {
            fileCounterState.counter++;
        } else {
            fileCounterState.lastDate = currentDateString;
            fileCounterState.counter = 1;
        }

        // Format nama file
        const formattedDocType = documentType.replace(/ /g, '_');
        const filename = `${fileCounterState.lastDate}-${fileCounterState.counter}_${formattedDocType}.pdf`;
        
        console.log("Generated filename:", filename);
        console.log("Document type used:", documentType);
        return filename;
    }

    // --- FUNGSI PEMROSESAN INPUT BARU ---
    function processInputValue(value) {
        if (value === null || value === undefined) return '';
        
        // Ganti tanda kutip ganda berulang dengan " INCH"
        let processed = value.toString()
            .replace(/"""{1,2}/g, ' INCH')  // Tangani """ dan ""
            .replace(/""/g, ' INCH');       // Tangani ""
        
        // Ubah ke uppercase
        processed = processed.toUpperCase();
        
        // Ganti multiple spaces dengan single space
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

    // Fungsi untuk menghapus tanda kutip di layout kanan
    function removeQuotesFromRightLayout() {
        const rightLayoutInputs = document.querySelectorAll('.layout-column:last-child input[type="text"]');
        rightLayoutInputs.forEach(input => {
            input.value = input.value.replace(/"/g, '');
        });
    }

    // Fungsi untuk menerapkan data dari baris tertentu
    function applyTableData(row = 1) {
        try {
            // Gunakan fungsi pemrosesan baru untuk semua nilai input
            const materialVal = processInputValue(document.getElementById(`table-material-${row}`).value);
            const descriptionVal = processInputValue(document.getElementById(`table-description-${row}`).value);
            const partNumberVal = processInputValue(document.getElementById(`table-partnumber-${row}`).value);
            const uomVal = processInputValue(document.getElementById(`table-uom-${row}`).value);
            const matTypeVal = processInputValue(document.getElementById(`table-mattype-${row}`).value);
            const matGroupVal = processInputValue(document.getElementById(`table-matgroup-${row}`).value);

            // Layout kiri (Before) - gunakan nilai yang sudah diproses
            document.getElementById('material').value = materialVal;
            document.getElementById('description').value = descriptionVal;
            document.getElementById('base-unit').value = uomVal;
            document.getElementById('material-group').value = matGroupVal;
            document.getElementById('mfr-part-number').value = partNumberVal;

            // Layout kanan (After) - gunakan nilai yang sudah diproses
            document.getElementById('material_2').value = materialVal;
            document.getElementById('description_2').value = descriptionVal;
            document.getElementById('base-unit_2').value = uomVal;
            document.getElementById('material-group_2').value = matGroupVal;
            document.getElementById('mfr-part-number_2').value = partNumberVal;

            // Highlight baris yang aktif
            highlightActiveRow(row);

            // Update baris aktif
            currentActiveRow = row;

            // Terapkan penghapus tanda kutip
            removeQuotesFromRightLayout();

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
        // Reset semua baris
        document.querySelectorAll('.row-input').forEach(input => {
            input.classList.remove('active-row');
        });

        // Highlight baris aktif
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

    // Fungsi paste dari Excel
    if (gridContainer) {
        gridContainer.addEventListener('paste', function(event) {
            event.preventDefault();
            const pastedText = (event.clipboardData || window.clipboardData).getData('text');
            const rows = pastedText.split('\n').map(row => row.split('\t'));

            for (let i = 0; i < Math.min(rows.length, 5); i++) {
                const rowData = rows[i];
                if (rowData.length >= 6) {
                    // Gunakan fungsi pemrosesan baru untuk semua nilai paste
                    document.getElementById(`table-material-${i+1}`).value = processInputValue(rowData[0] || '');
                    document.getElementById(`table-description-${i+1}`).value = processInputValue(rowData[1] || '');
                    document.getElementById(`table-partnumber-${i+1}`).value = processInputValue(rowData[2] || '');
                    document.getElementById(`table-uom-${i+1}`).value = processInputValue(rowData[3] || '');
                    document.getElementById(`table-mattype-${i+1}`).value = processInputValue(rowData[4] || '');
                    document.getElementById(`table-matgroup-${i+1}`).value = processInputValue(rowData[5] || '');

                    // Highlight baris
                    document.querySelectorAll(`.row-input[data-row="${i+1}"]`).forEach(input => {
                        input.classList.add('highlight-row');
                        setTimeout(() => input.classList.remove('highlight-row'), 1500);
                    });
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

        // Terapkan data dari baris ini
        applyTableData(row);

        // Beri waktu untuk render UI
        await new Promise(resolve => setTimeout(resolve, 300));

        // Buat PDF
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

        const filename = generateFilename();
        pdf.save(filename);

        return true;
    }

    // Handler untuk tombol Create Current PDF
    if (pdfBtn) {
        pdfBtn.addEventListener('click', async function() {
            const originalText = this.textContent;
            this.textContent = 'Creating PDF...';
            this.disabled = true;

            // Debug: tampilkan nilai dropdown saat ini
            const docTypeSelect = document.getElementById('kpi-type');
            console.log("Current dropdown value:", docTypeSelect ? docTypeSelect.value : "N/A");

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
                for (let i = 1; i <= 5; i++) {
                    // Lewati baris kosong
                    const materialVal = document.getElementById(`table-material-${i}`).value;
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

    // --- INISIALISASI AWAL ---
    // Set data row untuk semua input
    document.querySelectorAll('.row-input').forEach((input, index) => {
        const row = Math.floor(index / 6) + 1;
        input.dataset.row = row;
    });

    // Highlight baris pertama sebagai default
    highlightActiveRow(1);

    console.log("SAP Layout Generator siap dengan fitur 5 baris input!");
});
