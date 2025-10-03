function setFavicon() {
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/svg+xml';
    link.rel = 'shortcut icon';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="#4A69BD" d="M64 32C28.7 32 0 60.7 0 96v320c0 35.3 28.7 64 64 64h448c35.3 0 64-28.7 64-64V192c0-35.3-28.7-64-64-64H80c-8.8 0-16-7.2-16-16s7.2-16 16-16h368c17.7 0 32-14.3 32-32s-14.3-32-32-32H64zM80 256h384c8.8 0 16 7.2 16 16v160c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V272c0-8.8 7.2-16 16-16z"/></svg>`;
    link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    document.head.appendChild(link);
}
setFavicon();