/**
 * Script to initialize the Quote collection in MongoDB
 * Run this once after deploying the quote feature
 * 
 * Usage: node scripts/initQuote.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const Quote = require('../models/Quote');

const initQuote = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB\n');

        // Check if quote already exists
        const existingQuote = await Quote.findOne();
        
        if (existingQuote) {
            console.log('ℹ️  Quote already exists in database:');
            console.log(`   Text: "${existingQuote.text}"`);
            console.log(`   Author: ${existingQuote.author}`);
            console.log(`   Last Updated: ${existingQuote.updatedAt}\n`);
            
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            readline.question('Do you want to update the quote? (yes/no): ', async (answer) => {
                if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
                    readline.question('Enter new quote text: ', async (text) => {
                        readline.question('Enter author: ', async (author) => {
                            existingQuote.text = text;
                            existingQuote.author = author;
                            existingQuote.updatedAt = new Date();
                            await existingQuote.save();
                            
                            console.log('\n✅ Quote updated successfully!\n');
                            readline.close();
                            process.exit(0);
                        });
                    });
                } else {
                    console.log('\nNo changes made.');
                    readline.close();
                    process.exit(0);
                }
            });
        } else {
            console.log('📝 Creating default quote...');
            const defaultQuote = await Quote.create({
                text: "The pen is mightier than the sword.",
                author: "— Edward Bulwer-Lytton"
            });
            
            console.log('✅ Default quote created successfully!\n');
            console.log('═══════════════════════════════════════════');
            console.log('📝 Quote Details:');
            console.log(`   Text: "${defaultQuote.text}"`);
            console.log(`   Author: ${defaultQuote.author}`);
            console.log('═══════════════════════════════════════════\n');
            
            process.exit(0);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

initQuote();
