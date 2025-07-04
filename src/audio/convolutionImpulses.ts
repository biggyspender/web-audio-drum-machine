const data = import.meta.glob("./assets/audio/impulses/**/*.wav", {
  query: { url: true },
  eager: true,
  import: "default",
}) as Record<string, string>;
export const convolutionImpulses = Object.entries(data).map(
  ([filePath, url]) => {
    const [category, name] = getCategoryAndName(filePath);
    return {
      category,
      name,
      url,
    };
  }
);

function getCategoryAndName(filePath: string): [string, string] {
  const parts = filePath.split("/");
  const category = parts[parts.length - 2];
  const name = parts[parts.length - 1].replace(/\.\w+$/, "");
  return [category, name];
}
