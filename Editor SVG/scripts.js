let selectedElement = null;
let isDragging = false;
let offset = { x: 0, y: 0 };
let actions = [];
let currentActionIndex = -1;

function addShape(shape) {
    const svg = document.getElementById('canvas');
    let newShape;
    if (shape === 'line') {
        newShape = document.createElementNS("http://www.w3.org/2000/svg", "line");
        newShape.setAttribute('x1', '50');
        newShape.setAttribute('y1', '50');
        newShape.setAttribute('x2', '150');
        newShape.setAttribute('y2', '150');
    } else if (shape === 'ellipse') {
        newShape = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        newShape.setAttribute('cx', '100');
        newShape.setAttribute('cy', '100');
        newShape.setAttribute('rx', '50');
        newShape.setAttribute('ry', '30');
    } else if (shape === 'rect') {
        newShape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        newShape.setAttribute('x', '50');
        newShape.setAttribute('y', '50');
        newShape.setAttribute('width', '100');
        newShape.setAttribute('height', '80');
    }
    newShape.setAttribute('stroke', '#000000');
    newShape.setAttribute('stroke-width', '1');
    newShape.setAttribute('fill', '#ffffff');
    newShape.classList.add('selected');
    svg.appendChild(newShape);
    setupDrag(newShape);
    addAction({ type: 'add', element: newShape.cloneNode(true) });
}

function setupDrag(element) {
    element.addEventListener('mousedown', startDrag);
    element.addEventListener('mousemove', drag);
    element.addEventListener('mouseup', endDrag);
}

function startDrag(event) {
    isDragging = true;
    selectedElement = event.target;
    const svg = document.getElementById('canvas');
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const cursorPoint = point.matrixTransform(svg.getScreenCTM().inverse());
    offset.x = cursorPoint.x;
    offset.y = cursorPoint.y;

    if (selectedElement.tagName === 'line') {
        offset.x1 = parseFloat(selectedElement.getAttribute('x1'));
        offset.y1 = parseFloat(selectedElement.getAttribute('y1'));
        offset.x2 = parseFloat(selectedElement.getAttribute('x2'));
        offset.y2 = parseFloat(selectedElement.getAttribute('y2'));
    } else if (selectedElement.tagName === 'ellipse') {
        offset.cx = parseFloat(selectedElement.getAttribute('cx'));
        offset.cy = parseFloat(selectedElement.getAttribute('cy'));
    } else if (selectedElement.tagName === 'rect') {
        offset.x = parseFloat(selectedElement.getAttribute('x'));
        offset.y = parseFloat(selectedElement.getAttribute('y'));
        offset.width = parseFloat(selectedElement.getAttribute('width'));
        offset.height = parseFloat(selectedElement.getAttribute('height'));
    }
    offset.dx = cursorPoint.x - parseFloat(selectedElement.getAttribute('x'));
    offset.dy = cursorPoint.y - parseFloat(selectedElement.getAttribute('y'));
}

function drag(event) {
    if (isDragging && selectedElement) {
        const svg = document.getElementById('canvas');
        const point = svg.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        const cursorPoint = point.matrixTransform(svg.getScreenCTM().inverse());

        const dx = cursorPoint.x - offset.x;
        const dy = cursorPoint.y - offset.y;

        if (selectedElement.tagName === 'line') {
            selectedElement.setAttribute('x1', offset.x1 + dx);
            selectedElement.setAttribute('y1', offset.y1 + dy);
            selectedElement.setAttribute('x2', offset.x2 + dx);
            selectedElement.setAttribute('y2', offset.y2 + dy);
        } else if (selectedElement.tagName === 'ellipse') {
            selectedElement.setAttribute('cx', offset.cx + dx);
            selectedElement.setAttribute('cy', offset.cy + dy);
        } else if (selectedElement.tagName === 'rect') {
            const newX = cursorPoint.x - offset.dx;
            const newY = cursorPoint.y - offset.dy;
            selectedElement.setAttribute('x', newX);
            selectedElement.setAttribute('y', newY);
        }
    }
}

function endDrag() {
    isDragging = false;
    addAction({ type: 'modify', element: selectedElement.cloneNode(true) });
}

function changeStrokeColor(color) {
    if (selectedElement) {
        const prevColor = selectedElement.getAttribute('stroke');
        addAction({ type: 'modify', element: selectedElement.cloneNode(true), prevColor });
        selectedElement.setAttribute('stroke', color);
    }
}

function changeFillColor(color) {
    if (selectedElement) {
        const prevFillColor = selectedElement.getAttribute('fill');
        addAction({
            type: 'modify',
            element: selectedElement.cloneNode(true),
            prevFillColor,
            fillColor: color
        });
        selectedElement.setAttribute('fill', color);
    }
}

function changeThickness(thickness) {
    if (selectedElement) {
        const prevThickness = selectedElement.getAttribute('stroke-width');
        addAction({ type: 'modify', element: selectedElement.cloneNode(true), prevThickness });
        selectedElement.setAttribute('stroke-width', thickness);
    }
}

function deleteSelected() {
    if (selectedElement) {
        addAction({ type: 'remove', element: selectedElement.cloneNode(true) });
        selectedElement.parentNode.removeChild(selectedElement);
        selectedElement = null;
    }
}

function addAction(action) {
    actions.push(action);
    currentActionIndex = actions.length - 1;
}

function undo() {
    if (currentActionIndex >= 0) {
        const action = actions[currentActionIndex];
        const canvas = document.getElementById('canvas');

        if (action.type === 'modify') {
            const element = canvas.lastChild; // Assuming the element to be the last one
            if (element) {
                element.setAttribute('fill', action.prevFillColor);
            }
        }
        currentActionIndex--;
    }
}

function exportToRaster(format) {
    const svg = document.getElementById('canvas');

    const canvas = document.createElement('canvas');
    canvas.width = svg.clientWidth;
    canvas.height = svg.clientHeight;

    const ctx = canvas.getContext('2d');

    const svgString = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    img.onload = function () {
        ctx.drawImage(img, 0, 0);

        if (format === 'png') {
            const dataURL = canvas.toDataURL('image/png');
            downloadImage(dataURL, 'export.png');
        } else if (format === 'jpeg') {
            canvas.toBlob(blob => {
                const dataURL = URL.createObjectURL(blob);
                downloadImage(dataURL, 'export.jpg');
            }, 'image/jpeg', 1.0);
        }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
}

function downloadImage(dataURL, filename) {
    const blob = dataURLtoBlob(dataURL);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function dataURLtoBlob(dataURL) {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === 'z') {
        event.preventDefault();
        undo();
    }
});

function exportToSVG() {
    const svg = document.getElementById('canvas');
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'export.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
