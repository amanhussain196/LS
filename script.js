document.addEventListener('DOMContentLoaded', () => {
    // Smooth Scroll for "Enter Workshop"
    const enterBtn = document.getElementById('enter-workshop-btn');
    enterBtn.addEventListener('click', () => {
        document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
    });

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Hero Canvas Animation
    const canvas = document.getElementById('thread-canvas');
    const ctx = canvas.getContext('2d');

    let width, height;
    let particles = [];

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    window.addEventListener('resize', resize);
    resize();

    // String Art Pattern
    // We will simulate a circular string art pattern that slowly rotates and breathes

    const numPoints = 120;
    const radiusScale = 0.35; // % of min dimension
    let rotation = 0;
    let breathing = 0;

    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetRotation = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - width / 2) / width;
        mouseY = (e.clientY - height / 2) / height;
    });

    // Idle Detection & Animation System
    let lastActivity = Date.now();
    let idleOpacity = 0;
    const idleThreshold = 3000; // 3 seconds

    const resetIdle = () => {
        lastActivity = Date.now();
    };

    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('scroll', resetIdle);
    window.addEventListener('click', resetIdle);
    window.addEventListener('touchstart', resetIdle);

    // Idle Thread Class for Organic Movement
    class IdleThread {
        constructor(width, height) {
            this.init(width, height);
            this.phase = Math.random() * Math.PI * 2;
            this.speed = 0.0005 + Math.random() * 0.001; // Very slow
        }

        init(w, h) {
            // Pick a random edge
            const edge = Math.floor(Math.random() * 4);
            if (edge === 0) { // Top
                this.start = { x: Math.random() * w, y: 0 };
            } else if (edge === 1) { // Right
                this.start = { x: w, y: Math.random() * h };
            } else if (edge === 2) { // Bottom
                this.start = { x: Math.random() * w, y: h };
            } else { // Left
                this.start = { x: 0, y: Math.random() * h };
            }

            // Target roughly near center but wandering
            this.centerBase = {
                x: w * 0.5 + (Math.random() - 0.5) * w * 0.5,
                y: h * 0.5 + (Math.random() - 0.5) * h * 0.5
            };
        }

        update(time, w, h) {
            // Slowly move start point slightly along edge to feel "alive"
            // (Simplified: keeping start fixed for stability, animating curve)

            // Animate control points and end point for "floating" feel
            this.end = {
                x: this.centerBase.x + Math.sin(time * this.speed + this.phase) * (w * 0.1),
                y: this.centerBase.y + Math.cos(time * this.speed * 1.3 + this.phase) * (h * 0.1)
            };

            // Control points for Bezier curve
            this.cp1 = {
                x: this.start.x + (this.end.x - this.start.x) * 0.3 + Math.sin(time * 0.001 + this.phase) * 50,
                y: this.start.y + (this.end.y - this.start.y) * 0.3 + Math.cos(time * 0.001 + this.phase) * 50
            };

            this.cp2 = {
                x: this.start.x + (this.end.x - this.start.x) * 0.7 + Math.cos(time * 0.0008 + this.phase) * 50,
                y: this.start.y + (this.end.y - this.start.y) * 0.7 + Math.sin(time * 0.0008 + this.phase) * 50
            };
        }

        draw(ctx, opacity) {
            ctx.beginPath();
            ctx.moveTo(this.start.x, this.start.y);
            ctx.bezierCurveTo(this.cp1.x, this.cp1.y, this.cp2.x, this.cp2.y, this.end.x, this.end.y);
            ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`; // Pure black
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    // Initialize Idle Threads
    let idleThreads = [];
    const initIdleThreads = () => {
        idleThreads = [];
        const numThreads = 25; // Calm density
        for (let i = 0; i < numThreads; i++) {
            idleThreads.push(new IdleThread(width, height));
        }
    };

    // Update resize to handle idle threads
    const originalResize = resize;
    resize = function () {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        initIdleThreads(); // Re-init on resize
    };
    window.removeEventListener('resize', originalResize); // Clean up old listener
    window.addEventListener('resize', resize);
    resize(); // Initial call

    function draw() {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        const time = Date.now();

        // 1. Draw Existing Hero Animation (Always visible, slightly adjusted for layering)
        const cx = width / 2;
        const cy = height / 2;
        const minDim = Math.min(width, height);
        const radius = minDim * radiusScale + (Math.sin(breathing) * 20);

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'; // Darker lines
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

        // 2. Manage Idle Animation System
        const isIdle = (time - lastActivity) > idleThreshold;
        const targetOpacity = isIdle ? 0.2 : 0; // Max opacity 0.2 (darker)

        // Smooth fade
        idleOpacity += (targetOpacity - idleOpacity) * 0.02;

        if (idleOpacity > 0.001) {
            idleThreads.forEach(thread => {
                thread.update(time, width, height);
                thread.draw(ctx, idleOpacity);
            });
        }

        requestAnimationFrame(draw);
    }

    draw(); // Start the animation loop

    // Animation Sequence Logic
    const logoContainer = document.querySelector('.logo');
    const navLinks = document.querySelector('.nav-links');
    const heroContent = document.querySelector('.hero-content');
    const hasPlayed = sessionStorage.getItem('logoAnimationPlayed');

    if (!hasPlayed) {
        // 1. Play Logo Animation (Fade)
        logoContainer.classList.add('logo-animate');

        // 2. Fade in Nav after logo finishes (1.5s)
        setTimeout(() => {
            navLinks.classList.add('visible');
        }, 1500);

        // 3. Fade in Hero Content after Nav starts (1.5s + 0.5s)
        setTimeout(() => {
            heroContent.classList.add('visible');
        }, 2000);

        sessionStorage.setItem('logoAnimationPlayed', 'true');
    } else {
        // Immediate visibility for returning users
        logoContainer.classList.add('logo-static');
        navLinks.classList.add('visible');
        heroContent.classList.add('visible');
    }
});
