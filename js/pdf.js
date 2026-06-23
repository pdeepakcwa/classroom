/* ==========================================================
   PDF ENGINE
   PDF.js + Notebook Integration
========================================================== */

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

let currentPdf = null;
let currentPdfPage = 1;
let totalPdfPages = 0;

/* ==========================================================
   PDF LOAD
========================================================== */

async function loadPdfFile(file) {

    try {

        const buffer =
            await file.arrayBuffer();

        currentPdf =
            await pdfjsLib
            .getDocument({
                data: buffer
            })
            .promise;

        totalPdfPages =
            currentPdf.numPages;

        currentPdfPage = 1;

        renderPdfPage(
            currentPdfPage
        );

    }
    catch(err) {

        console.error(err);

        alert(
            "Unable to open PDF"
        );

    }

}

/* ==========================================================
   RENDER PAGE
========================================================== */

async function renderPdfPage(pageNumber) {

    if(!currentPdf)
        return;

    try {

        const page =
            await currentPdf.getPage(
                pageNumber
            );

        const viewport =
            page.getViewport({
                scale: 2
            });

        const tempCanvas =
            document.createElement(
                "canvas"
            );

        const ctx =
            tempCanvas.getContext(
                "2d"
            );

        tempCanvas.width =
            viewport.width;

        tempCanvas.height =
            viewport.height;

        await page.render({

            canvasContext: ctx,

            viewport

        }).promise;

        fabric.Image.fromURL(

            tempCanvas.toDataURL(
                "image/jpeg",
                0.9
            ),

            img => {

                boardCanvas.clear();

                img.selectable =
                    false;

                img.evented =
                    false;

                img.left = 0;
                img.top = 0;

                img.scaleToWidth(
                    boardCanvas.width
                );

                boardCanvas.add(
                    img
                );

                boardCanvas.sendToBack(
                    img
                );

                boardCanvas.renderAll();

updatePdfLabel();

saveState();

broadcastWhiteboard();

broadcastPdfPage();

            }

        );

    }
    catch(err){

        console.error(err);

    }

}

/* ==========================================================
   NEXT PAGE
========================================================== */

function nextPdfPage() {

    if(
        !currentPdf
    ) return;

    if(
        currentPdfPage >=
        totalPdfPages
    ) return;

    currentPdfPage++;
    updatePdfLabel();

    renderPdfPage(
        currentPdfPage
    );

}

/* ==========================================================
   PREVIOUS PAGE
========================================================== */

function previousPdfPage() {

    if(
        !currentPdf
    ) return;

    if(
        currentPdfPage <= 1
    ) return;

    currentPdfPage--;
    updatePdfLabel();
    renderPdfPage(
        currentPdfPage
    );

}

/* ==========================================================
   BROADCAST PDF PAGE
========================================================== */

function broadcastPdfPage() {

    if(
        typeof sendWhiteboardData
        !== "function"
    ) return;

    sendWhiteboardData({

        type:
        "pdf-page",

        page:
        currentPdfPage

    });

}

/* ==========================================================
   RECEIVE PDF PAGE
========================================================== */

function receivePdfPage(
    pageNumber
) {

    if(
        !currentPdf
    ) return;

    currentPdfPage =
        pageNumber;

    renderPdfPage(
        currentPdfPage
    );

}

/* ==========================================================
   PDF TOOLBAR
========================================================== */

function createPdfToolbar() {

    const toolbar =
        document.createElement(
            "div"
        );

    toolbar.id =
        "pdfToolbar";

    toolbar.style.position =
        "absolute";

    toolbar.style.top =
        "70px";

    toolbar.style.right =
        "20px";

    toolbar.style.zIndex =
        "999";

    toolbar.style.display =
        "flex";

    toolbar.style.gap =
        "10px";

    toolbar.innerHTML = `
        <button id="pdfPrevBtn">
            ◀ PDF
        </button>

        <span id="pdfPageLabel">
            Page 1
        </span>

        <button id="pdfNextBtn">
            PDF ▶
        </button>
    `;

    document.body.appendChild(
        toolbar
    );

    document
        .getElementById(
            "pdfPrevBtn"
        )
        ?.addEventListener(
            "click",
            previousPdfPage
        );

    document
        .getElementById(
            "pdfNextBtn"
        )
        ?.addEventListener(
            "click",
            nextPdfPage
        );

}

/* ==========================================================
   UPDATE LABEL
========================================================== */

function updatePdfLabel() {

    const label =
        document.getElementById(
            "pdfPageLabel"
        );

    if(!label)
        return;

    label.textContent =
        `${currentPdfPage} / ${totalPdfPages}`;

}

/* ==========================================================
   ZOOM PDF
========================================================== */

let pdfZoom = 1;

function zoomPdfIn() {

    pdfZoom += 0.25;

    rerenderCurrentPdf();

}

function zoomPdfOut() {

    if(pdfZoom <= 0.5)
        return;

    pdfZoom -= 0.25;

    rerenderCurrentPdf();

}

async function rerenderCurrentPdf() {

    if(!currentPdf)
        return;

    const page =
        await currentPdf.getPage(
            currentPdfPage
        );

    const viewport =
        page.getViewport({

            scale:
            pdfZoom * 2

        });

    const tempCanvas =
        document.createElement(
            "canvas"
        );

    const ctx =
        tempCanvas.getContext(
            "2d"
        );

    tempCanvas.width =
        viewport.width;

    tempCanvas.height =
        viewport.height;

    await page.render({

        canvasContext: ctx,

        viewport

    }).promise;

    fabric.Image.fromURL(

        tempCanvas.toDataURL(),

        img => {

            boardCanvas.clear();

            img.selectable =
                false;

            img.evented =
                false;

            boardCanvas.add(
                img
            );

            boardCanvas.sendToBack(
                img
            );

            boardCanvas.renderAll();

        }

    );

}

/* ==========================================================
   FILE INPUT
========================================================== */

function attachPdfInput() {

    document
        .getElementById(
            "pdfInput"
        )
        ?.addEventListener(
            "change",
            e => {

                const file =
                    e.target.files[0];

                if(file){

                    loadPdfFile(
                        file
                    );

                }

            }
        );

}

/* ==========================================================
   INIT
========================================================== */

function initPdf() {

    attachPdfInput();

    createPdfToolbar();

}

/* ==========================================================
   EVENTS
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    ()=>{

        initPdf();

    }
); 
