document.addEventListener('DOMContentLoaded', () => {
    // 1. Navigation & UI Setup
    const buyBtn = document.getElementById('buy-now-btn');
    if (buyBtn) {
        buyBtn.addEventListener('click', () => {
            const shopSection = document.getElementById('shop');
            if (shopSection) shopSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    const seqGenBtn = document.getElementById('sequence-generator-btn');
    if (seqGenBtn) {
        seqGenBtn.addEventListener('click', startTransition);
    }

    // 2. Canvas Setup
    const canvas = document.getElementById('thread-canvas');
    const ctx = canvas.getContext('2d');

    let width, height;

    // State Management
    let appState = 'hero'; // 'hero', 'transition', 'generator'
    let transitionStartTime = 0;
    const TRANSITION_DURATION = 2000;

    // --------------------------------------------------------
    // CLASSES
    // --------------------------------------------------------

    class IdleThread {
        constructor(width, height) {
            this.init(width, height);
            this.phase = Math.random() * Math.PI * 2;
            this.speed = 0.0005 + Math.random() * 0.001;
        }

        init(w, h) {
            const edge = Math.floor(Math.random() * 4);
            if (edge === 0) this.start = { x: Math.random() * w, y: 0 };
            else if (edge === 1) this.start = { x: w, y: Math.random() * h };
            else if (edge === 2) this.start = { x: Math.random() * w, y: h };
            else this.start = { x: 0, y: Math.random() * h };

            this.centerBase = {
                x: w * 0.5 + (Math.random() - 0.5) * w * 0.5,
                y: h * 0.5 + (Math.random() - 0.5) * h * 0.5
            };
        }

        update(time, w, h) {
            this.end = {
                x: this.centerBase.x + Math.sin(time * this.speed + this.phase) * (w * 0.1),
                y: this.centerBase.y + Math.cos(time * this.speed * 1.3 + this.phase) * (h * 0.1)
            };
            this.cp1 = {
                x: this.start.x + (this.end.x - this.start.x) * 0.3 + Math.sin(time * 0.001 + this.phase) * 50,
                y: this.start.y + (this.end.y - this.start.y) * 0.3 + Math.cos(time * 0.001 + this.phase) * 50
            };
            this.cp2 = {
                x: this.start.x + (this.end.x - this.start.x) * 0.7 + Math.cos(time * 0.0008 + this.phase) * 50,
                y: this.start.y + (this.end.y - this.start.y) * 0.7 + Math.sin(time * 0.0008 + this.phase) * 50
            };
        }

        draw(ctx, opacity, color = '0, 0, 0') {
            ctx.beginPath();
            ctx.moveTo(this.start.x, this.start.y);
            ctx.bezierCurveTo(this.cp1.x, this.cp1.y, this.cp2.x, this.cp2.y, this.end.x, this.end.y);
            ctx.strokeStyle = `rgba(${color}, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    class TransitionThread {
        constructor(w, h) {
            this.w = w;
            this.h = h;
            this.reset();
        }

        reset() {
            const edge = Math.floor(Math.random() * 4);

            if (edge === 0) { // Top
                this.start = { x: Math.random() * this.w, y: -20 };
                this.target = { x: Math.random() * this.w, y: this.h + 20 };
            } else if (edge === 1) { // Right
                this.start = { x: this.w + 20, y: Math.random() * this.h };
                this.target = { x: -20, y: Math.random() * this.h };
            } else if (edge === 2) { // Bottom
                this.start = { x: Math.random() * this.w, y: this.h + 20 };
                this.target = { x: Math.random() * this.w, y: -20 };
            } else { // Left
                this.start = { x: -20, y: Math.random() * this.h };
                this.target = { x: this.w + 20, y: Math.random() * this.h };
            }

            // Randomized control points for "organic" tension
            this.cp1 = {
                x: this.start.x + (this.target.x - this.start.x) * 0.3 + (Math.random() - 0.5) * 200,
                y: this.start.y + (this.target.y - this.start.y) * 0.3 + (Math.random() - 0.5) * 200
            };
            this.cp2 = {
                x: this.start.x + (this.target.x - this.start.x) * 0.7 + (Math.random() - 0.5) * 200,
                y: this.start.y + (this.target.y - this.start.y) * 0.7 + (Math.random() - 0.5) * 200
            };

            this.progress = 0;
            // Accelerate: starts slow-ish, gets faster
            this.speed = 0.02 + Math.random() * 0.03;
            // Constant acceleration factor
            this.acceleration = 1.05;
        }

        update() {
            this.speed *= this.acceleration;
            this.progress += this.speed;
        }

        draw(ctx) {
            // Draw the FULL curve to stack it
            ctx.beginPath();
            ctx.moveTo(this.start.x, this.start.y);

            ctx.bezierCurveTo(
                this.cp1.x, this.cp1.y,
                this.cp2.x, this.cp2.y,
                this.target.x, this.target.y
            );

            ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'; // Thread-like darkness
            ctx.lineWidth = 0.6; // Thinner lines
            ctx.stroke();
        }
    }

    // --------------------------------------------------------
    // INITIALIZATION & STATE
    // --------------------------------------------------------

    let idleThreads = [];
    let generatorThreads = [];

    const initIdleThreads = () => {
        idleThreads = [];
        const numThreads = 25;
        for (let i = 0; i < numThreads; i++) {
            idleThreads.push(new IdleThread(width, height));
        }
    };

    const initGeneratorThreads = () => {
        generatorThreads = [];
        const numThreads = 30;
        for (let i = 0; i < numThreads; i++) {
            const t = new IdleThread(width, height);
            generatorThreads.push(t);
        }
    };

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        if (typeof initIdleThreads === 'function') initIdleThreads();
        if (appState === 'generator') {
            initGeneratorThreads();
        }
    }

    window.addEventListener('resize', resize);
    resize();

    // --------------------------------------------------------
    // ANIMATION LOOP VARIABLES
    // --------------------------------------------------------

    const numPoints = 120;
    const radiusScale = 0.35;
    let rotation = 0;
    let breathing = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetRotation = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - width / 2) / width;
        mouseY = (e.clientY - height / 2) / height;
    });

    let lastActivity = Date.now();
    let idleOpacity = 0;
    const idleThreshold = 3000;

    const resetIdle = () => {
        lastActivity = Date.now();
    };
    ['mousemove', 'scroll', 'click', 'touchstart'].forEach(evt =>
        window.addEventListener(evt, resetIdle)
    );

    // --------------------------------------------------------
    // MAIN DRAW LOOP
    // --------------------------------------------------------

    function draw() {
        const time = Date.now();

        if (appState === 'hero') {
            ctx.clearRect(0, 0, width, height); // Clear white

            drawCircularArt(ctx, width, height, time, '0, 0, 0');

            const isIdle = (time - lastActivity) > idleThreshold;
            const targetOpacity = isIdle ? 0.2 : 0;
            idleOpacity += (targetOpacity - idleOpacity) * 0.02;

            if (idleOpacity > 0.001) {
                idleThreads.forEach(thread => {
                    thread.update(time, width, height);
                    thread.draw(ctx, idleOpacity, '0, 0, 0');
                });
            }

        } else if (appState === 'transition') {
            // DO NOT clear rect. Accumulate lines.

            const elapsed = time - transitionStartTime;
            const progress = Math.min(elapsed / TRANSITION_DURATION, 1);

            // "Motion should accelerate quickly in the first second"
            // "Slow slightly as density increases" (meaning perception, or spawn rate?)
            // Prompt says: "Motion should accelerate quickly ... then slow slightly"
            // This might refer to the individual thread speed or the overall pacing.
            // Let's interpret as generation rate increases.

            // Spawn Rate Strategy:
            let linesToAdd = 0;
            if (progress < 0.5) {
                // Accelerating spawn
                linesToAdd = 3 + Math.floor(progress * 40);
            } else {
                // High density, slower spawn increase
                linesToAdd = 23 + Math.floor((progress - 0.5) * 10);
            }

            // Toward the end, massive dump to ensure black
            if (progress > 0.85) linesToAdd += 40;

            for (let i = 0; i < linesToAdd; i++) {
                const t = new TransitionThread(width, height);
                t.draw(ctx);
            }

            if (elapsed > TRANSITION_DURATION) {
                appState = 'generator';
                const setGen = document.getElementById('sequence-generator');
                setGen.classList.remove('hidden');
                setGen.classList.add('active');

                document.querySelector('.navbar').style.display = 'none'; // Hide Top Nav

                const shopSection = document.getElementById('shop');
                if (shopSection) shopSection.style.display = 'none'; // Hide Products

                // Force black background
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, width, height);
                initGeneratorThreads();
            }

        } else if (appState === 'generator') {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height); // Always clear with black

            drawCircularArt(ctx, width, height, time, '255, 255, 255');

            // Idle logic for Generator (same as Hero)
            const isIdle = (time - lastActivity) > idleThreshold;
            const targetOpacity = isIdle ? 0.2 : 0;
            idleOpacity += (targetOpacity - idleOpacity) * 0.02;

            if (idleOpacity > 0.001) {
                generatorThreads.forEach(thread => {
                    thread.update(time, width, height);
                    thread.draw(ctx, idleOpacity, '255, 255, 255');
                });
            }
        }

        requestAnimationFrame(draw);
    }

    function drawCircularArt(ctx, w, h, time, colorRGB) {
        const cx = w / 2;
        const cy = h / 2;
        const minDim = Math.min(w, h);
        const radius = minDim * radiusScale + (Math.sin(breathing) * 20);

        ctx.strokeStyle = `rgba(${colorRGB}, 0.2)`;
        ctx.lineWidth = 1;

        const points = [];
        targetRotation = mouseX * 0.2;
        rotation += (targetRotation - rotation) * 0.02;
        const currentRotation = rotation + (time * 0.00005);

        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2 + currentRotation;
            const distort = Math.sin(angle * 3) * (mouseY * 20);
            points.push({
                x: cx + Math.cos(angle) * (radius + distort),
                y: cy + Math.sin(angle) * (radius + distort)
            });
        }

        const offsets = [30, 40, 50];
        offsets.forEach(offset => {
            ctx.beginPath();
            for (let i = 0; i < numPoints; i++) {
                const p1 = points[i];
                const p2 = points[(i + offset) % numPoints];
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
            }
            ctx.stroke();
        });

        breathing += 0.005;
    }

    function startTransition() {
        if (appState !== 'hero') return;
        appState = 'transition';
        transitionStartTime = Date.now();

        // Hide UI elements smoothly via CSS
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) heroContent.style.opacity = '0';

        const navbar = document.querySelector('.navbar');
        if (navbar) navbar.style.opacity = '0';
    }

    draw();

    // --------------------------------------------------------
    // INTRO ANIMATION
    // --------------------------------------------------------
    const logoContainer = document.querySelector('.logo');
    const navLinks = document.querySelector('.nav-links');
    const heroContent = document.querySelector('.hero-content');
    const hasPlayed = sessionStorage.getItem('logoAnimationPlayed');

    if (!hasPlayed) {
        logoContainer.classList.add('logo-animate');
        setTimeout(() => navLinks.classList.add('visible'), 1500);
        setTimeout(() => heroContent.classList.add('visible'), 2000);
        sessionStorage.setItem('logoAnimationPlayed', 'true');
    } else {
        logoContainer.classList.add('logo-static');
        navLinks.classList.add('visible');
        heroContent.classList.add('visible');
    }

    // --------------------------------------------------------
    // GENERATOR WORKSPACE LOGIC
    // --------------------------------------------------------

    const generateNowBtn = document.getElementById('generate-now-btn');
    const generatorWorkspace = document.getElementById('generator-workspace');

    if (generateNowBtn) {
        generateNowBtn.addEventListener('click', () => {
            if (generatorWorkspace) {
                generatorWorkspace.classList.remove('hidden');
                setTimeout(() => {
                    generatorWorkspace.scrollIntoView({ behavior: 'smooth' });
                }, 10);
            }
        });
    }

    // --------------------------------------------------------
    // STRING ART GENERATOR INTEGRATION
    // --------------------------------------------------------
    const uploadTrigger = document.getElementById('upload-trigger');
    const imageInput = document.getElementById('image-upload');
    const processingView = document.getElementById('processing-view');
    const artCanvas = document.getElementById('art-canvas');
    const statusText = document.getElementById('status-text');
    const progressBar = document.getElementById('progress-bar');

    // Controls
    const btnStart = document.getElementById('btn-start-gen');
    const btnStop = document.getElementById('btn-stop-gen');
    const btnReset = document.getElementById('btn-reset-gen');
    const btnSaveGallery = document.getElementById('btn-save-gallery');
    const galleryContainer = document.getElementById('gallery-container');
    const galleryGrid = document.getElementById('gallery-grid');

    let generatorEngine = null;
    let isGenerating = false;
    let animationFrameId = null;

    if (uploadTrigger && imageInput && artCanvas) {
        const ctx = artCanvas.getContext('2d');


        const cropperContainer = document.getElementById('cropper-container');
        const cropCanvas = document.getElementById('crop-canvas');
        const cropCancelBtn = document.getElementById('crop-cancel-btn');
        const cropConfirmBtn = document.getElementById('crop-confirm-btn');

        let uploadedImage = null;
        let cropState = { x: 0, y: 0, scale: 1, minScale: 1 };

        // 1. Image Upload Handler
        const handleImageUpload = (file) => {
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    uploadedImage = img;
                    initCropper();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        };

        // --- CROPPER LOGIC ---
        function initCropper() {
            if (!uploadedImage) return;

            uploadTrigger.classList.add('hidden');
            cropperContainer.classList.remove('hidden');

            const size = Math.min(window.innerWidth - 40, 400);
            cropCanvas.width = size;
            cropCanvas.height = size;
            const ctx = cropCanvas.getContext('2d');

            const scaleW = size / uploadedImage.width;
            const scaleH = size / uploadedImage.height;
            const initialScale = Math.max(scaleW, scaleH);

            cropState = {
                x: (size - uploadedImage.width * initialScale) / 2,
                y: (size - uploadedImage.height * initialScale) / 2,
                scale: initialScale,
                minScale: 0.1
            };

            drawCrop(ctx);
            setupCropEvents(cropCanvas, ctx);
        }

        function drawCrop(ctx) {
            if (!uploadedImage) return;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, cropCanvas.width, cropCanvas.height);

            ctx.save();
            ctx.translate(cropState.x, cropState.y);
            ctx.scale(cropState.scale, cropState.scale);
            ctx.drawImage(uploadedImage, 0, 0);
            ctx.restore();
        }

        function setupCropEvents(canvas, ctx) {
            let isDragging = false;
            let startX, startY, lastX, lastY;

            const onDown = (x, y) => {
                isDragging = true;
                startX = x; startY = y;
                lastX = cropState.x; lastY = cropState.y;
            };

            const onMove = (x, y) => {
                if (!isDragging) return;
                const dx = x - startX;
                const dy = y - startY;
                cropState.x = lastX + dx;
                cropState.y = lastY + dy;
                drawCrop(ctx);
            };

            canvas.onmousedown = (e) => onDown(e.clientX, e.clientY);
            window.onmousemove = (e) => onMove(e.clientX, e.clientY);
            window.onmouseup = () => isDragging = false;

            canvas.ontouchstart = (e) => {
                if (e.touches.length === 1) onDown(e.touches[0].clientX, e.touches[0].clientY);
            };
            canvas.ontouchmove = (e) => {
                if (e.touches.length === 1) {
                    e.preventDefault();
                    onMove(e.touches[0].clientX, e.touches[0].clientY);
                }
            };
            canvas.ontouchend = () => isDragging = false;

            // Simple Wheel Zoom
            canvas.onwheel = (e) => {
                e.preventDefault();
                cropState.scale -= e.deltaY * 0.001;
                drawCrop(ctx);
            };
        }

        cropCancelBtn.addEventListener('click', () => {
            uploadedImage = null;
            cropperContainer.classList.add('hidden');
            uploadTrigger.classList.remove('hidden');
        });

        cropConfirmBtn.addEventListener('click', () => {
            if (!uploadedImage) return;

            // Capture cropped content
            processingView.classList.remove('hidden');
            cropperContainer.classList.add('hidden');

            const size = 500;
            // Draw crop to temp canvas then to art canvas
            // actually we can just draw from cropped canvas logic, but higher res?
            // Let's just redraw the cropped view onto the 500x500 canvas

            // Map crop canvas view (W x H) to 500x500
            // cropState was for 'cropCanvas.width/height'.
            // scaling factor = 500 / cropCanvas.width

            const upscale = size / cropCanvas.width;

            ctx.clearRect(0, 0, size, size);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, size, size);

            ctx.save();
            ctx.scale(upscale, upscale);
            ctx.translate(cropState.x, cropState.y);
            ctx.scale(cropState.scale, cropState.scale);
            ctx.drawImage(uploadedImage, 0, 0);
            ctx.restore();

            // Display Source Image separately
            const sourceDisplay = document.getElementById('source-image-display');
            if (sourceDisplay) {
                sourceDisplay.src = artCanvas.toDataURL();
            }

            // Save source state for regeneration
            if (!window.sourceCanvasCache) {
                window.sourceCanvasCache = document.createElement('canvas');
            }
            window.sourceCanvasCache.width = size;
            window.sourceCanvasCache.height = size;
            window.sourceCanvasCache.getContext('2d').drawImage(artCanvas, 0, 0);

            // Initialize Engine
            if (typeof StringArtGenerator !== 'undefined') {
                // Header Updates
                const workspaceHeader = document.querySelector('#generator-workspace h2');
                const workspaceSub = document.querySelector('#generator-workspace .workspace-sub');
                if (workspaceHeader) workspaceHeader.innerText = "Generator Ready";
                if (workspaceSub) workspaceSub.innerText = "Click start to begin.";

                generatorEngine = new StringArtGenerator(size, size);
                generatorEngine.loadFromElement(artCanvas);

                // Clear canvas again to prepare for drawing lines
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, size, size);

                statusText.innerText = "Image Processed. Ready.";
                btnStart.disabled = false;
            }
        });
        uploadTrigger.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', (e) => handleImageUpload(e.target.files[0]));

        // Drag & Drop
        uploadTrigger.addEventListener('dragover', (e) => { e.preventDefault(); uploadTrigger.style.borderColor = '#fff'; });
        uploadTrigger.addEventListener('dragleave', (e) => { e.preventDefault(); uploadTrigger.style.borderColor = '#444'; });
        uploadTrigger.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadTrigger.style.borderColor = '#444';
            handleImageUpload(e.dataTransfer.files[0]);
        });

        // 2. Generation Logic
        if (btnStart) {
            btnStart.addEventListener('click', () => {
                if (!generatorEngine) return;
                if (isGenerating) return;

                // Reset canvas
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, 500, 500);

                // Reload original image data to ensure clean state
                if (window.sourceCanvasCache) {
                    generatorEngine.loadFromElement(window.sourceCanvasCache);
                }

                isGenerating = true;
                btnStart.disabled = true;

                // Setup Pins
                const NAILS = 200;
                generatorEngine.initPins(NAILS, 'square');

                // Style for drawing
                ctx.lineWidth = 0.5;
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';

                const lineSelect = document.getElementById('line-count-select');
                const MAX_LINES = lineSelect ? parseInt(lineSelect.value, 10) : 3000;
                let linesDrawn = 0;

                statusText.innerText = "Generating...";

                const loop = () => {
                    if (!isGenerating) return;
                    if (linesDrawn >= MAX_LINES) {
                        isGenerating = false;
                        statusText.innerText = "Complete!";
                        btnStart.disabled = false;
                        if (btnSaveGallery) btnSaveGallery.disabled = false;
                        return;
                    }

                    const steps = generatorEngine.generateSteps(10);

                    steps.forEach(step => {
                        ctx.beginPath();
                        ctx.moveTo(step.p1.x, step.p1.y);
                        ctx.lineTo(step.p2.x, step.p2.y);
                        ctx.stroke();
                    });

                    linesDrawn += steps.length;

                    if (progressBar) {
                        progressBar.style.width = `${(linesDrawn / MAX_LINES) * 100}%`;
                    }

                    animationFrameId = requestAnimationFrame(loop);
                };

                loop();
            });
        }

        if (btnStop) {
            btnStop.addEventListener('click', () => {
                isGenerating = false;
                statusText.innerText = "Stopped.";
                btnStart.disabled = false;
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
            });
        }

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                isGenerating = false;
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                generatorEngine = null;

                processingView.classList.add('hidden');
                uploadTrigger.classList.remove('hidden');

                const sourceDisplay = document.getElementById('source-image-display');
                if (sourceDisplay) sourceDisplay.src = '';

                // Reset Headers
                const workspaceHeader = document.querySelector('#generator-workspace h2');
                const workspaceSub = document.querySelector('#generator-workspace .workspace-sub');
                if (workspaceHeader) workspaceHeader.innerText = "Upload Your Photo";
                if (workspaceSub) workspaceSub.innerText = "Process your image into string art.";

                imageInput.value = '';
                btnStart.disabled = false;
                if (progressBar) progressBar.style.width = '0%';
                if (btnSaveGallery) btnSaveGallery.disabled = true;
            });
        }

        // Gallery Logic
        const deleteGalleryItem = (id) => {
            const saved = JSON.parse(localStorage.getItem('stringArtGallery') || '[]');
            const updated = saved.filter(item => item.id !== id);
            localStorage.setItem('stringArtGallery', JSON.stringify(updated));
            renderGallery();
        };

        const renderGallery = () => {
            if (!galleryGrid || !galleryContainer) return;
            let saved = JSON.parse(localStorage.getItem('stringArtGallery') || '[]');

            // Migration & Cleanup Logic
            saved = saved.map(item => {
                if (item.data && !item.artData) {
                    return { ...item, artData: item.data };
                }
                return item;
            }).filter(item => item.artData && item.artData.length > 100);

            // Force limit if exceeded (e.g. from previous versions)
            if (saved.length > 3) {
                saved = saved.slice(saved.length - 3);
                localStorage.setItem('stringArtGallery', JSON.stringify(saved));
            }

            if (saved.length > 0) {
                galleryContainer.classList.remove('hidden');
                galleryGrid.innerHTML = '';

                // Show newest first
                [...saved].reverse().forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'gallery-item';
                    div.style.width = '100%'; // Full width
                    div.style.marginBottom = '2rem'; // Spacing between items

                    // Handle missing source data for older items
                    const sourceDisplay = item.sourceData ?
                        `<img src="${item.sourceData}" style="width: 100%; height: auto; border-radius: 4px; display: block; object-fit: cover;" title="Original">` :
                        `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #555; background: #000; font-size: 0.9rem;">No Source</div>`;

                    div.innerHTML = `
                        <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                            <div style="flex: 1; aspect-ratio: 1; overflow: hidden; border-radius: 4px; background: #000;">
                                ${sourceDisplay}
                            </div>
                             <div style="flex: 1; aspect-ratio: 1; overflow: hidden; border-radius: 4px; background: #000;">
                                <img src="${item.artData}" style="width: 100%; height: 100%; object-fit: cover;" title="String Art">
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 5px;">
                            <span style="font-size: 0.75rem; color: #666; font-family: 'Inter', sans-serif;">${new Date(item.id).toLocaleDateString()}</span>
                            <button class="gallery-delete-btn" data-id="${item.id}" style="
                                background: transparent; 
                                border: none; 
                                color: #666; 
                                font-size: 0.75rem; 
                                cursor: pointer;
                                transition: all 0.2s;
                                text-decoration: underline;
                            ">Delete</button>
                        </div>
                    `;
                    galleryGrid.appendChild(div);
                });
            } else {
                galleryContainer.classList.add('hidden');
            }
        };


        if (btnSaveGallery) {
            btnSaveGallery.addEventListener('click', () => {
                if (!artCanvas) return;

                // Capture Source
                let sourceData = '';
                if (window.sourceCanvasCache) {
                    sourceData = window.sourceCanvasCache.toDataURL();
                } else {
                    const sourceDisplay = document.getElementById('source-image-display');
                    if (sourceDisplay) sourceData = sourceDisplay.src;
                }

                const artData = artCanvas.toDataURL();
                const saved = JSON.parse(localStorage.getItem('stringArtGallery') || '[]');

                // Check limit (Max 3) - Warn instead of overwrite
                if (saved.length >= 3) {
                    alert("Gallery is full (Max 3). Please delete an old item below to save this new one.");
                    // Scroll to gallery
                    galleryContainer.scrollIntoView({ behavior: 'smooth' });
                    return;
                }

                saved.push({ id: Date.now(), artData, sourceData });
                localStorage.setItem('stringArtGallery', JSON.stringify(saved));

                renderGallery();
                alert('Saved to Gallery!');
            });
        }

        if (galleryGrid) {
            galleryGrid.addEventListener('click', (e) => {
                if (e.target.classList.contains('gallery-delete-btn')) {
                    const id = Number(e.target.dataset.id);
                    if (confirm("Permanently delete this item?")) {
                        deleteGalleryItem(id);
                    }
                }
            });
        }

        // Initial render
        renderGallery();
    }
});
