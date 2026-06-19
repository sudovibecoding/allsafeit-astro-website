// Seamless, truly-infinite carousel.
//
// Strategy: clone the FULL set of slides once and append the clones. Advancing
// past the last real slide scrolls into the clones (which look identical to the
// originals), and on `transitionend` we snap the track back to the equivalent
// real position with the transition disabled — invisible to the user. Cloning
// the whole set (not just one slide) keeps the wrap seamless even when several
// cards are visible at once. Supports prev/next buttons + autoplay, pauses on
// hover, and respects prefers-reduced-motion.
export function initSliders(): void {
  document.querySelectorAll<HTMLElement>('[data-slider]').forEach((slider) => {
    const mask = slider.querySelector<HTMLElement>('[data-slider-mask]');
    const prevBtn = slider.querySelector<HTMLElement>('[data-slider-prev]');
    const nextBtn = slider.querySelector<HTMLElement>('[data-slider-next]');
    if (!mask) return;

    const realSlides = Array.from(
      mask.querySelectorAll<HTMLElement>('[data-slider-slide]'),
    );
    const count = realSlides.length;
    if (count === 0) return;

    // Append a clone of every real slide for the seamless wrap.
    realSlides.forEach((slide) => {
      const clone = slide.cloneNode(true) as HTMLElement;
      clone.setAttribute('aria-hidden', 'true');
      clone.removeAttribute('data-slider-slide'); // clones aren't real steps
      mask.appendChild(clone);
    });

    let index = 0;
    const autoplayDelay = Number(slider.dataset.sliderDelay ?? 4000);
    let timer: ReturnType<typeof setInterval> | null = null;

    function render(animate: boolean): void {
      mask!.style.transition = animate ? 'transform 0.5s ease' : 'none';
      // Each step = one slide width (the mask is exactly one slide wide).
      mask!.style.transform = `translateX(-${index * 100}%)`;
    }
    render(false);

    function next(): void {
      index += 1;
      render(true);
    }

    function prev(): void {
      if (index === 0) {
        // Jump (no animation) to the equivalent clone position, then animate
        // back one step so the leftward motion stays continuous.
        index = count;
        render(false);
        requestAnimationFrame(() => {
          index -= 1;
          render(true);
        });
      } else {
        index -= 1;
        render(true);
      }
    }

    // When we land on a clone (index >= count), snap back to the matching real
    // slide with no transition — the visuals are identical, so it's invisible.
    mask.addEventListener('transitionend', () => {
      if (index >= count) {
        index -= count;
        render(false);
      }
    });

    function startAutoplay(): void {
      if (timer) clearInterval(timer);
      timer = setInterval(next, autoplayDelay);
    }
    function stopAutoplay(): void {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    prevBtn?.addEventListener('click', () => {
      stopAutoplay();
      prev();
      startAutoplay();
    });
    nextBtn?.addEventListener('click', () => {
      stopAutoplay();
      next();
      startAutoplay();
    });

    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      startAutoplay();
    }
  });
}
