export default function linear_serch(
    haystack: number[],
    neddle: number,
): boolean {
    for (let i = 0; i < haystack.length; ++i) {
        if (haystack[i] === neddle) {
            return true;
        }
    }
    return false;
}
