import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

async function fileExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function validateMaterials(materials) {
  if (!Array.isArray(materials) || materials.length === 0) {
    throw new Error("materials must be a non-empty array");
  }

  const materialIds = new Set();
  const wordIds = new Set();

  for (const material of materials) {
    if (!material || !isNonEmptyString(material.id)) {
      throw new Error("material id must be a non-empty string");
    }
    if (!isNonEmptyString(material.name)) {
      throw new Error(`material name must be non-empty for ${material.id}`);
    }
    if (!Array.isArray(material.words)) {
      throw new Error(`material words must be an array for ${material.id}`);
    }
    if (materialIds.has(material.id)) {
      throw new Error(`duplicate material id: ${material.id}`);
    }
    materialIds.add(material.id);

    for (const word of material.words) {
      if (!word || !isNonEmptyString(word.id)) {
        throw new Error(`word id must be a non-empty string in ${material.id}`);
      }
      if (wordIds.has(word.id)) {
        throw new Error(`duplicate word id: ${word.id}`);
      }
      if (!isNonEmptyString(word.word)) {
        throw new Error(`word must be non-empty for ${word.id}`);
      }
      if (!Array.isArray(word.meanings) || !word.meanings.some((meaning) => isNonEmptyString(meaning?.zh))) {
        throw new Error(`word must have a non-empty Chinese meaning: ${word.id}`);
      }
      wordIds.add(word.id);
    }
  }
}

function resolveSourcePath(rootDir, sourcePath) {
  return isAbsolute(sourcePath) ? sourcePath : resolve(rootDir, sourcePath);
}

async function selectSources(rootDir, configPath) {
  const localConfigPath = configPath
    ? resolveSourcePath(rootDir, configPath)
    : join(rootDir, "config", "local.json");

  if (await fileExists(localConfigPath)) {
    const config = await readJson(localConfigPath);
    if (!Array.isArray(config.vocabularySources) || config.vocabularySources.length === 0) {
      throw new Error("config vocabularySources must be a non-empty array");
    }
    if (!config.vocabularySources.every(isNonEmptyString)) {
      throw new Error("config vocabularySources must contain non-empty paths");
    }
    return config.vocabularySources.map((sourcePath) => resolveSourcePath(rootDir, sourcePath));
  }

  return [join(rootDir, "data", "sample", "materials.json")];
}

export async function prepareData({ rootDir = repositoryRoot, configPath } = {}) {
  const resolvedRootDir = resolve(rootDir);
  const sources = await selectSources(resolvedRootDir, configPath);
  const materials = (await Promise.all(sources.map(readJson))).flat();
  validateMaterials(materials);

  const outputPath = join(resolvedRootDir, "src", "data", "generated", "materials.js");
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `module.exports = { materials: ${JSON.stringify(materials, null, 2)} };\n`);

  return {
    outputPath,
    materialCount: materials.length,
    wordCount: materials.reduce((count, material) => count + material.words.length, 0),
    source: sources.join(", "),
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await prepareData();
  console.log(`source: ${result.source}`);
  console.log(`material count: ${result.materialCount}`);
  console.log(`word count: ${result.wordCount}`);
  console.log(`output path: ${result.outputPath}`);
}
