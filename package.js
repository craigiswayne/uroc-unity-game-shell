import {globby} from 'globby';
import fs from 'fs-extra';
import path from 'path';

const DESTINATION_DIR = 'dist';
fs.emptyDirSync(DESTINATION_DIR);

async function copyFilesWithGlob(sourceGlobs, destinationDir, baseDirectory = process.cwd()) {
    try {
        // 1. Ensure the baseDirectory exists and is absolute
        const absoluteBaseDirectory = path.resolve(baseDirectory);
        if (!fs.existsSync(absoluteBaseDirectory)) {
            console.error(`Error: Base directory '${absoluteBaseDirectory}' does not exist.`);
            process.exit(1);
        }

        // 2. Find all files/directories matching the glob patterns relative to the baseDirectory
        const pathsToCopy = await globby(sourceGlobs, {
            dot: true, // Include dotfiles (e.g., .env)
            expandDirectories: false, // Don't expand directories into their contents unless explicitly matched
            onlyFiles: false, // Include directories themselves if matched by glob
            cwd: absoluteBaseDirectory // Globs are relative to this base directory
        });

        if (pathsToCopy.length === 0) {
            console.warn('No files or directories matched the specified glob patterns. Nothing to copy.');
            return;
        }

        console.log(`Found ${pathsToCopy.length} items to copy relative to '${absoluteBaseDirectory}':`);
        pathsToCopy.forEach(p => console.log(`- ${p}`));

        // 3. Copy each found path to the destination, maintaining its relative structure
        const copyPromises = pathsToCopy.map(async (relativePathFromBase) => {
            // Get the full source path
            const sourcePath = path.join(absoluteBaseDirectory, relativePathFromBase);

            // Construct the full destination path, including the relative folder structure
            const destPath = path.join(destinationDir, relativePathFromBase);

            console.log(`Copying '${sourcePath}' to '${destPath}'...`);
            // fs-extra.copy handles creating parent directories if they don't exist
            await fs.copy(sourcePath, destPath, {overwrite: true});
        });

        await Promise.all(copyPromises);
        console.log('\nAll specified files and folders copied successfully, maintaining paths!');

    } catch (error) {
        console.error('An error occurred during file copying:', error);
        process.exit(1);
    }
}

const SOURCE_PATTERNS = [
    'TemplateData/**/*',
    'index.html',
    'thumbnail.png',
    '!**/*.scss',
    '!**/*.map'
];

copyFilesWithGlob(SOURCE_PATTERNS, DESTINATION_DIR, process.cwd());