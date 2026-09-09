
const uploadBoxHTML = document.getElementById('upload-box').innerHTML;//saved so reset can restore the original upload box

function loadImageFile(file)//takes in a file image/png/jpeg
{
    let width, height;//define
    if (!file) return;//failsafe

    const img = new Image();//element not in dom
    img.style.height = '90%';//this was here but it doesn't work without CSS for the output box too
    img.style.width = 'auto';          //
    img.style.objectFit = 'contain';   //still for the preview

    const reader = new FileReader();//read the image


    reader.onload = function(theimage)//       -----------|
    {//                                        |          |
        img.src = theimage.target.result;//2   | <--      |
 //                                                 \     |
    };//                                            |     |
    reader.readAsDataURL(file);//1 -----------------      |
    img.onload = function()//3  <-------------------------|
    {
        width = img.naturalWidth;   //get the default width/height
        height = img.naturalHeight; //

        const factor1 = Math.floor(width / height);  //the closest width factors as to where the image can be cut to squares (height is factor of width)
        const factor2 = Math.ceil(width / height);   //
        const closer1 = factor1 * height;  //the actual width candidates of the image
        const closer2 = factor2 * height;  //
        let targetWidth;//define
        if (Math.abs(closer1 - width) <= Math.abs(closer2 - width))// i came back to this code after a while and thought that was an evil backwards arrow callback
        {
            targetWidth = closer1;//
        }                         //
        else                      //whichever is actulally closer to the width
        {                         //
            targetWidth = closer2;//
        }

        const uploadBox = document.getElementById('upload-box');//where the button is/was
        uploadBox.innerHTML = '';//remove it
        uploadBox.appendChild(img);//add the preview image
        const numSquares = targetWidth / height;//number of square emojis
        let databox = document.getElementById('data-box');
        databox.innerHTML = 'width: ' + width + ', height: ' + height + ', stretched/squashed width: ' + targetWidth + ', number of emoji squares: ' + numSquares;//tell the user the fact of them matter

        //actually slice the (stretched/squashed) image into perfect squares
        const fullCanvas = document.createElement('canvas');//bitmap canvas
        fullCanvas.width = targetWidth;
        fullCanvas.height = height;
        const fullCtx = fullCanvas.getContext('2d');
        fullCtx.imageSmoothingEnabled = true;
        fullCtx.imageSmoothingQuality = 'high';
        fullCtx.drawImage(img, 0, 0, targetWidth, height);//drawing the image stretched

        const outputBox = document.getElementById('output-box');
        outputBox.innerHTML = '';
        for (let i = 0; i < numSquares; i++) {
            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = height;
            sliceCanvas.height = height;
            const sliceCtx = sliceCanvas.getContext('2d');
            sliceCtx.drawImage(fullCanvas, i * height, 0, height, height, 0, 0, height, height);//which square to slice this time
            const slice = document.createElement('img');
            slice.src = sliceCanvas.toDataURL('image/png');
            slice.alt = '#moji ' + (i + 1);
            //adds an outline and label to each emoji
            const tile = document.createElement('div');
            tile.className = 'emoji-tile';
            const indexLabel = document.createElement('span');
            indexLabel.className = 'emoji-index';
            indexLabel.textContent = i + 1;
            tile.appendChild(indexLabel);
            tile.appendChild(slice);
            outputBox.appendChild(tile);
            //adds the click event to each emoji
        }

        addOutputButtons();
    };
}

let currentSuffix = '';//shared between the zip names and the paste string so they always match

function addOutputButtons()
{
    const outputBox = document.getElementById('button-box');
    outputBox.innerHTML = '';//clear old buttons so pasting again doesn't stack more
    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'download as ZIP';
    downloadButton.addEventListener('click', downloadZip);//do the respective things
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset';
    resetButton.addEventListener('click', resetAll);//do the respective things
    outputBox.appendChild(downloadButton);
    outputBox.appendChild(resetButton);
    //give the user a paste string
    currentSuffix = randomLetters(3);//one suffix per generated image set so re-uploads to the same server don't collide
    const count = document.querySelectorAll('#output-box img').length;
    let pasteString = '';
    for (let i = 1; i <= count; i++) pasteString += ':em' + i + currentSuffix + ':';
    const pasteBox = document.getElementById('paste-box');
    pasteBox.hidden = false;
    document.getElementById('paste-string').textContent = pasteString;
}

function randomLetters(count)//random a-z/A-Z string
{
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';//the string
    for (let i = 0; i < count; i++)//for all letters (which is 3)
    {
        result += alphabet[Math.floor(Math.random() * alphabet.length)];//add random ltter to the string
    }
    return result;//return the string
}

function downloadZip()
{
    const imgs = document.querySelectorAll('#output-box img');//each img element
    if (!imgs.length) return;//failsafe
    const suffix = currentSuffix;//same suffix shown in the paste box
    const files = [];//empty for now array
    imgs.forEach((imgEl, i) =>//imgEl is the image and i is its index number
    {
        const bin = atob(imgEl.src.split(',')[1]);//become raw bytes
        const bytes = new Uint8Array(bin.length);
        for (let j = 0; j < bin.length; j++) 
        {
            bytes[j] = bin.charCodeAt(j);//copying the bytes
        }
        files.push({ name: 'em' + (i + 1) + suffix + '.png', data: bytes });//add it to the files array
    });
    const url = URL.createObjectURL(makeZip(files));//make the zip blob
    const a = document.createElement('a');
    a.href = url;//point it to the blob url
    a.download = 'emoji-slices.zip';//download name
    a.click();
    URL.revokeObjectURL(url);
}

function resetAll()//back to default
{
    document.getElementById('paste-box').hidden = true;
    document.getElementById('output-box').innerHTML = '';
    document.getElementById('data-box').innerHTML = '<p>upload an image above...</p>';
    document.getElementById('upload-box').innerHTML = uploadBoxHTML;
}

//START THE ZIP WRITING CODE THAT I BORROWED AND DON'T FEEL LIKE READING
const crcTable = (() =>
{
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++)
    {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        t[n] = c;
    }
    return t;
})();

function crc32(bytes)
{
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = crcTable[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
}

function makeZip(files)
{
    const enc = new TextEncoder();
    const parts = [];
    const central = [];
    let offset = 0;
    for (const f of files)
    {
        const nameBytes = enc.encode(f.name);
        const crc = crc32(f.data);
        const lh = new DataView(new ArrayBuffer(30));
        lh.setUint32(0, 0x04034b50, true);
        lh.setUint16(4, 20, true);
        lh.setUint16(8, 0, true);
        lh.setUint32(14, crc, true);
        lh.setUint32(18, f.data.length, true);
        lh.setUint32(22, f.data.length, true);
        lh.setUint16(26, nameBytes.length, true);
        parts.push(new Uint8Array(lh.buffer), nameBytes, f.data);
        central.push({ nameBytes, crc, size: f.data.length, offset });
        offset += 30 + nameBytes.length + f.data.length;
    }
    const cdStart = offset;
    for (const c of central)
    {
        const ch = new DataView(new ArrayBuffer(46));
        ch.setUint32(0, 0x02014b50, true);
        ch.setUint16(4, 20, true);
        ch.setUint16(6, 20, true);
        ch.setUint32(16, c.crc, true);
        ch.setUint32(20, c.size, true);
        ch.setUint32(24, c.size, true);
        ch.setUint16(28, c.nameBytes.length, true);
        ch.setUint32(42, c.offset, true);
        parts.push(new Uint8Array(ch.buffer), c.nameBytes);
        offset += 46 + c.nameBytes.length;
    }
    const eocd = new DataView(new ArrayBuffer(22));
    eocd.setUint32(0, 0x06054b50, true);
    eocd.setUint16(8, central.length, true);
    eocd.setUint16(10, central.length, true);
    eocd.setUint32(12, offset - cdStart, true);
    eocd.setUint32(16, cdStart, true);
    parts.push(new Uint8Array(eocd.buffer));
    return new Blob(parts, { type: 'application/zip' });
}
//END ZIP WRITING CODE

document.addEventListener('change', e =>//upload button (delegated so it still works after a reset restores the original input element)
{
    if (e.target.id === 'image-input') 
    {
        loadImageFile(e.target.files[0]);
    }
});

document.getElementById('copy-button').addEventListener('click', () =>//copy the emoji string to the clipboard
{
    navigator.clipboard.writeText(document.getElementById('paste-string').textContent);
});

document.addEventListener('paste', e =>//pasting in a png directly
{
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;//failsafes
    for (const item of items)
    {
        if (item.type.startsWith('image/'))
        {
            loadImageFile(item.getAsFile());
            break;
        }
    }
});

