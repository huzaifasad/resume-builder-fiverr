const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const pdf = require('pdf-parse');

const app = express();
app.use(express.json());
app.use(cors({
    origin: "*", // Update to your frontend URL
    methods: ["POST", "GET","PUT","DELETE"],
    credentials: true
  }));

const PORT = process.env.PORT || 3000;
// Multer configuration for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});

const upload = multer({ storage: storage });

app.post('/upload-pdf', upload.single('pdfFile'), async (req, res) => {
    const pdfPath = req.file.path;

    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const pdfData = await pdf(dataBuffer);

        const pdfText = pdfData.text;
      
        
        try {
            const response = await axios.post('https://api.openai.com/v1/completions', {
                model: "gpt-3.5-turbo-instruct",
                prompt: `CV Details: ${pdfText}\n\nCreate a tailored resume`,
                max_tokens: 500
            }, {
                headers: {
                    'Authorization': `Bearer sk-proj-DL9pVs8thZA0u5E7WE0tT3BlbkFJx23q8AGVZrmOOlYd7Cl6`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (response.data && response.data.choices && response.data.choices.length > 0) {
                res.json({ pdfText: response.data.choices[0].text });
                console.log('Response form openai :: '+response.data.choices[0].text)
            } else {
                res.status(500).send('Failed to generate resume due to empty response from API.');
            }
        } catch (error) {
            console.error('Error making API request:', error.response ? error.response.data : error.message);
            res.status(500).send('Error generating resume');
        }
      
        // res.json({ pdfText });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error processing PDF and generating resume');
    }
});


// API endpoint for generating a resume
// app.post('/upload-pdf', upload.single('pdfFile'), async (req, res) => {
//     const pdfPath = req.file.path;
//     console.log(pdfPath);

//     try {
//         const dataBuffer = fs.readFileSync(pdfPath);
//         const pdfData = await pdf(dataBuffer);

//         const pdfText = pdfData.text;
//         console.log('Text Content:', pdfText);

//         // Make a request to OpenAI API with the extracted text
//         const openAIResponse = await axios.post('https://api.openai.com/v1/completions', {
//             model: "gpt-3.5-turbo-instruct",
//             prompt: pdfText,
//             max_tokens: 500
//         }, {
//             headers: {
//                 'Authorization': `Bearer ${OPENAI_API_KEY}`,
//                 'Content-Type': 'application/json'
//             }
//         });

//         if (openAIResponse.data && openAIResponse.data.choices && openAIResponse.data.choices.length > 0) {
//             const resume = openAIResponse.data.choices[0].text;
//             console.log('Generated Resume:', resume);
//             res.json({ pdfText, resume });
//         } else {
//             res.status(500).send('Failed to generate resume from extracted text.');
//         }
//     } catch (error) {
//         console.error('Error:', error);
//         res.status(500).send('Error processing PDF and generating resume');
//     }
// });
app.post('/generate-resume', async (req, res) => {
    const { jobDescription, cvDetails } = req.body;
    if (!jobDescription.trim() || !cvDetails.trim()) {
        return res.status(400).send('Both job description and CV details are required and cannot be empty.');
    }

    try {
        const response = await axios.post('https://api.openai.com/v1/completions', {
            model: "gpt-3.5-turbo-instruct",
            prompt: `Job Description: ${jobDescription}\nCV Details: ${cvDetails}\n\nCreate a tailored resume:`,
            max_tokens: 500
        }, {
            headers: {
                'Authorization': `Bearer sk-proj-DL9pVs8thZA0u5E7WE0tT3BlbkFJx23q8AGVZrmOOlYd7Cl6`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.choices && response.data.choices.length > 0) {
            res.json({ resume: response.data.choices[0].text });
        } else {
            res.status(500).send('Failed to generate resume due to empty response from API.');
        }
    } catch (error) {
        console.error('Error making API request:', error.response ? error.response.data : error.message);
        res.status(500).send('Error generating resume');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
