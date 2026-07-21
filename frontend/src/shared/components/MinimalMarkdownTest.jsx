import React from 'react';
import ReactMarkdown from "react-markdown";

export default function MinimalMarkdownTest({ content }) {
    return <ReactMarkdown>{content}</ReactMarkdown>;
}