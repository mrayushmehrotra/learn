export default function binary_fn(haystack: number[], needle: number): boolean {
    let low = 0;
    let high = haystack.length;

    do {
        let mid = Math.floor(low + (high - low) / 2);
        let mp = haystack[mid];

        if (mp === needle) {
            return true;
        } else if (mp > needle) {
            high = mid;
        } else {
            low = mid + 1;
        }
    } while (low < high);
    return false;
}
