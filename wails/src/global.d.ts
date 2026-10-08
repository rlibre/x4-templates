// Allow importing SVG assets as URL/inline strings
declare module "*.svg" {
    const content: string;
    export default content;
}
