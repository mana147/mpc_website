// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const headerNav = document.querySelector('.header-nav');

if (mobileMenuToggle && headerNav) {
    mobileMenuToggle.addEventListener('click', function () {
        this.classList.toggle('active');
        headerNav.classList.toggle('show');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (event) {
        const isClickInsideMenu = headerNav.contains(event.target);
        const isClickOnToggle = mobileMenuToggle.contains(event.target);

        if (!isClickInsideMenu && !isClickOnToggle && headerNav.classList.contains('show')) {
            mobileMenuToggle.classList.remove('active');
            headerNav.classList.remove('show');
        }
    });

    // Close menu when clicking on a regular link (not sub-menu parent)
    const navLinks = document.querySelectorAll('.nav-menu a:not(.menu-item > a)');
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            mobileMenuToggle.classList.remove('active');
            headerNav.classList.remove('show');
        });
    });
}

// Sub-menu Toggle on Mobile (click vào "DỊCH VỤ")
document.querySelectorAll('.menu-item').forEach(function (item) {
    const link = item.querySelector(':scope > a');
    const subMenu = item.querySelector('.sub-menu');

    if (link && subMenu) {
        link.addEventListener('click', function (e) {
            if (window.innerWidth <= 959) {
                e.preventDefault();
                item.classList.toggle('open');
                subMenu.classList.toggle('show');
            }
        });
    }
});

/* ---------- TAB SWITCH ---------- */
const tabs = document.querySelectorAll(".tab-item");
const panes = document.querySelectorAll(".tab-pane");

// tabs.forEach(tab => {
//     tab.addEventListener("click", () => {
//         tabs.forEach(t => t.classList.remove("active"));
//         panes.forEach(p => p.classList.remove("active"));
//
//         tab.classList.add("active");
//         document.getElementById(tab.dataset.tab).classList.add("active");
//     });
// });

/* ---------- IMAGE SLIDER ---------- */
const arrayImages = [
    "../assets/landing/facility-img1.png",
    "../assets/landing/facility-img2.png",
    "../assets/landing/facility-img3.png",
    "../assets/landing/facility-img4.png"
];

let currentIndex = 0;
const mainImage = document.getElementById("mainImage");
const nextBtn = document.querySelector(".next-btn");
const nextBtnService = document.querySelector(".next-btn-service");
const thumbs = document.querySelectorAll(".thumb");

function showImage(index) {
    currentIndex = index;
    mainImage.src = arrayImages[index];

    thumbs.forEach(t => t.classList.remove("active"));
    thumbs[index].classList.add("active");
}

/* click thumbnail */
thumbs.forEach((thumb, index) => {
    thumb.addEventListener("click", () => showImage(index));
});

/* next button */
nextBtn.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % images.length;
    showImage(currentIndex);
});

nextBtnService.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % arrayImages.length;
    showImage(currentIndex);
});


// SERVICE SLIDER
const slides = document.getElementById("slides");
const pages = document.querySelectorAll(".page");
const dotElements = document.querySelectorAll(".dot");
const arrowLeft = document.querySelector(".arrow.left");
const arrowRight = document.querySelector(".arrow.right");

let activeIndex = 0;

function updateSlider() {
    slides.style.transform = `translateX(-${activeIndex * 100}%)`;
    dotElements.forEach(d => d.classList.remove("active"));
    if (dotElements[activeIndex]) {
        dotElements[activeIndex].classList.add("active");
    }
}

dotElements.forEach((dot, i) => {
    dot.addEventListener("click", () => {
        activeIndex = i;
        updateSlider();
    });
});

arrowRight.addEventListener("click", () => {
    activeIndex = (activeIndex + 1) % pages.length;
    updateSlider();
});

arrowLeft.addEventListener("click", () => {
    activeIndex = (activeIndex - 1 + pages.length) % pages.length;
    updateSlider();
});

// LIBRARY IMAGES
const images = [
    "../assets/landing/library-img1.png",
    "../assets/landing/event-img1.png",
    "../assets/landing/service-img1.png"
];

let current = 0;

function nextSlide() {
    current++;
    if (current >= images.length) {
        current = 0;
    }

    const slider = document.getElementById("sliderImage");
    slider.style.opacity = 0;

    setTimeout(() => {
        slider.src = images[current];
        slider.style.opacity = 1;
    }, 300);
}
