const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// API Endpoint: Convert a webpage URL to PDF and save it
app.post('/convert-to-pdf', async (req, res) => {
    const { url } = req.body;

    // Validate the URL
    if (!url || !isValidHttpUrl(url)) {
        return res.status(400).json({ error: 'A valid URL must be provided.' });
    }

    let browser;
    try {
        // Launch Puppeteer browser
        browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Navigate to the URL
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Ensure the outputs folder exists
        const outputDir = path.join(__dirname, 'outputs');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        // Generate a unique filename
        const timestamp = Date.now();
        const filename = `webpage-${timestamp}.pdf`;
        const filePath = path.join(outputDir, filename);

        // Save the PDF to the outputs folder
        await page.pdf({
            path: filePath,
            format: 'A4',
            printBackground: true
        });

        // Respond with a success message and file path
        res.status(200).json({
            message: 'PDF successfully saved.',
            filePath: filePath
        });
    } catch (error) {
        console.error('Error generating PDF:', error.message);
        res.status(500).json({ error: 'Failed to generate PDF. Please try again later.' });
    } finally {
        // Ensure the browser is closed
        if (browser) await browser.close();
    }
});

// Function to validate a URL
function isValidHttpUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
