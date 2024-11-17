import { useRef, useEffect } from "react";

import { TranscriberData } from "../hooks/useTranscriber";
import { formatAudioTimestamp } from "../utils/AudioUtils";
import OpenAI from "openai";
import { OPENAI_API_KEY } from "../env";
import { judgePrompt } from "../prompt";

interface Props {
    transcribedData: TranscriberData | undefined;
}

export default function Transcript({ transcribedData }: Props) {
    const divRef = useRef<HTMLDivElement>(null);

    const saveBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    };
    const exportTXT = async () => {
        let chunks = transcribedData?.chunks ?? [];
        let text = chunks
            .map((chunk) => chunk.text)
            .join("")
            .trim();

        const openAI = new OpenAI({
            apiKey: OPENAI_API_KEY,
            dangerouslyAllowBrowser: true,
        });

        const response = await openAI.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "user", content: `${judgePrompt} \n\n ${text}` },
            ],
        });

        const summary = response.choices[0].message.content || "";

        console.log(`summary: ${summary}`);

        const blob = new Blob([summary, "\n\n", text], { type: "text/plain" });

        console.log(text);
        saveBlob(blob, "transcript.txt");
    };
    const exportJSON = () => {
        let jsonData = JSON.stringify(transcribedData?.chunks ?? [], null, 2);

        // post-process the JSON to make it more readable
        const regex = /(    "timestamp": )\[\s+(\S+)\s+(\S+)\s+\]/gm;
        jsonData = jsonData.replace(regex, "$1[$2 $3]");

        const blob = new Blob([jsonData], { type: "application/json" });
        saveBlob(blob, "transcript.json");
    };

    // Scroll to the bottom when the component updates
    useEffect(() => {
        if (divRef.current) {
            const diff = Math.abs(
                divRef.current.offsetHeight +
                    divRef.current.scrollTop -
                    divRef.current.scrollHeight,
            );

            if (diff <= 64) {
                // We're close enough to the bottom, so scroll to the bottom
                divRef.current.scrollTop = divRef.current.scrollHeight;
            }
        }
    });

    return (
        <div
            ref={divRef}
            className='w-full flex flex-col my-2 p-4 max-h-[20rem] overflow-y-auto'
        >
            {transcribedData?.chunks &&
                transcribedData.chunks.map((chunk, i) => (
                    <div
                        key={`${i}-${chunk.text}`}
                        className='w-full flex flex-row mb-2 bg-white rounded-lg p-4 shadow-xl shadow-black/5 ring-1 ring-slate-700/10'
                    >
                        <div className='mr-5'>
                            {formatAudioTimestamp(chunk.timestamp[0])}
                        </div>
                        {chunk.text}
                    </div>
                ))}
            {transcribedData && !transcribedData.isBusy && (
                <div className='w-full text-right'>
                    <button
                        onClick={exportTXT}
                        className='text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2 text-center mr-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 inline-flex items-center'
                    >
                        Export Notes
                    </button>
                </div>
            )}
        </div>
    );
}
