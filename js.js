
document.getElementById('image-input').addEventListener('change', e => 
{
    const file = e.target.files[0];
    let width, height;
    if (!file) return;

    const img = new Image();
    img.style.height = '90%';
    img.style.width = 'auto';
    img.style.objectFit = 'contain';

    const reader = new FileReader();


    reader.onload = function(theimage)//       -----------|
    {//                                        |          |
        img.src = theimage.target.result;//2   | <--      |
//                                                  \     |
    };//                                            |     |
    reader.readAsDataURL(file);//1 -----------------      |
    img.onload = function()//3  <-------------------------|
    {
        width = img.naturalWidth;
        height = img.naturalHeight;

        const factor1 = Math.floor(width / height);
        const factor2 = Math.ceil(width / height);
        const closer1 = factor1 * height;
        const closer2 = factor2 * height;
        let targetWidth;
        if (Math.abs(closer1 - width) <= Math.abs(closer2 - width)) 
        {
            targetWidth = closer1;
        } 
        else 
        {
            targetWidth = closer2;
        }

        const uploadBox = document.getElementById('upload-box');
        uploadBox.innerHTML = '';
        uploadBox.appendChild(img);
        const numSquares = targetWidth / height;
        let databox = document.getElementById('data-box');
        databox.innerHTML = 'width: ' + width + ', height: ' + height + ', stretched/squashed width: ' + targetWidth + ', number of emoji squares: ' + numSquares;
        console.log(width, height, targetWidth, numSquares);
    };


    
});

