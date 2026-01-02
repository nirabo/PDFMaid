const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const pdfGenerator = require('../lib/pdf-generator');

jest.mock('fs');
jest.mock('child_process');

describe('pdf-generator', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findChrome', () => {
    it('should find Chrome in a common path', () => {
      const targetPath = '/usr/bin/chromium-browser';
      fs.existsSync.mockImplementation((p) => p === targetPath);
      expect(pdfGenerator.findChrome()).toBe(targetPath);
    });

    it('should find Chrome using CHROME_PATH env var', () => {
      process.env.CHROME_PATH = '/env/path/to/chrome';
      fs.existsSync.mockImplementation((p) => p === process.env.CHROME_PATH);
      expect(pdfGenerator.findChrome()).toBe('/env/path/to/chrome');
      delete process.env.CHROME_PATH;
    });

    it('should find Chrome using which/where command', () => {
      fs.existsSync.mockReturnValue(false);
      execSync.mockReturnValue(
        '/usr/bin/google-chrome\n/usr/bin/some-other-chrome',
      );
      expect(pdfGenerator.findChrome()).toBe('/usr/bin/google-chrome');
    });

    it('should return null if Chrome is not found', () => {
      fs.existsSync.mockReturnValue(false);
      execSync.mockImplementation(() => {
        throw new Error('Command not found');
      });
      expect(pdfGenerator.findChrome()).toBeNull();
    });
  });

  describe('htmlToPdf', () => {
    const inputPath = 'input.html';
    const outputPath = 'output.pdf';
    const chromePath = '/fake/chrome';

    beforeEach(() => {
      fs.existsSync.mockImplementation(
        (p) => path.resolve(p) === path.resolve(inputPath),
      );
      jest.spyOn(pdfGenerator, 'findChrome').mockReturnValue(chromePath);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should generate a PDF successfully', () => {
      execSync.mockImplementation(() => {});
      fs.existsSync.mockImplementation((p) => {
        const resolvedP = path.resolve(p);
        return (
          resolvedP === path.resolve(inputPath) ||
          resolvedP === path.resolve(outputPath)
        );
      });

      const result = pdfGenerator.htmlToPdf(inputPath, outputPath);
      expect(result).toBe(path.resolve(outputPath));
      expect(execSync).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if input file not found', () => {
      fs.existsSync.mockReturnValue(false);
      expect(() =>
        pdfGenerator.htmlToPdf('nonexistent.html', outputPath),
      ).toThrow('Input file not found');
    });

    it('should throw an error if Chrome is not found', () => {
      pdfGenerator.findChrome.mockReturnValue(null);
      expect(() => pdfGenerator.htmlToPdf(inputPath, outputPath)).toThrow(
        'Chrome/Chromium not found',
      );
    });

    it('should throw an error if execSync fails', () => {
      const errorMessage = 'Chrome headless failed';
      execSync.mockImplementation(() => {
        throw new Error(errorMessage);
      });
      expect(() => pdfGenerator.htmlToPdf(inputPath, outputPath)).toThrow(
        `Failed to generate PDF: ${errorMessage}`,
      );
    });

    it('should throw an error if PDF was not created', () => {
      execSync.mockImplementation(() => {});
      fs.existsSync.mockImplementation(
        (p) => path.resolve(p) === path.resolve(inputPath),
      );

      expect(() => pdfGenerator.htmlToPdf(inputPath, outputPath)).toThrow(
        'PDF was not created',
      );
    });

    it('should construct the correct Chrome command with default options', () => {
      execSync.mockImplementation(() => {});
      fs.existsSync.mockImplementation((p) => {
        const resolvedP = path.resolve(p);
        return (
          resolvedP === path.resolve(inputPath) ||
          resolvedP === path.resolve(outputPath)
        );
      });

      pdfGenerator.htmlToPdf(inputPath, outputPath, {});
      const command = execSync.mock.calls[0][0];
      expect(command).toContain(`"${chromePath}"`);
      expect(command).toContain('--headless');
      expect(command).toContain(`--print-to-pdf="${path.resolve(outputPath)}"`);
    });

    it('should include landscape option in command when specified', () => {
      execSync.mockImplementation(() => {});
      fs.existsSync.mockImplementation((p) => {
        const resolvedP = path.resolve(p);
        return (
          resolvedP === path.resolve(inputPath) ||
          resolvedP === path.resolve(outputPath)
        );
      });

      pdfGenerator.htmlToPdf(inputPath, outputPath, { landscape: true });
      expect(execSync.mock.calls[0][0]).toContain('--landscape');
    });

    it('should include margin options in command when specified', () => {
      execSync.mockImplementation(() => {});
      fs.existsSync.mockImplementation((p) => {
        const resolvedP = path.resolve(p);
        return (
          resolvedP === path.resolve(inputPath) ||
          resolvedP === path.resolve(outputPath)
        );
      });

      pdfGenerator.htmlToPdf(inputPath, outputPath, { marginTop: '1cm' });
      expect(execSync.mock.calls[0][0]).toContain('--print-to-pdf-no-header');
    });
  });
});
