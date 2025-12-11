// lib/services/ai/contract-ai-service.ts

export const ContractAI = {
    async generateVariables(systemPrompt: string, userPrompt: string): Promise<{ variables: any; error?: string }> {
        // SIMULATED DELAY FOR DEMO
        await new Promise(resolve => setTimeout(resolve, 2500));

        try {
            // In production, call your API route here:
            // const res = await fetch('/api/ai/generate', { 
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ systemPrompt, userPrompt })
            // });
            // const data = await res.json();
            // return { variables: data.variables };
            
            // For now, return mock data based on prompt detection
            // This ensures the demo works immediately without an API key
            
            const isProposal = systemPrompt.toLowerCase().includes('proposal') || 
                              userPrompt.toLowerCase().includes('proposal');
            
            if (isProposal) {
                return {
                    variables: {
                        coverLetter: `Dear Hiring Manager,\n\nI am writing to express my strong interest in the position described. With my background in the relevant field, I am confident I can deliver the results you are looking for.\n\nI have reviewed your requirements and I understand you need a solution that is efficient and scalable. My approach involves leveraging modern technologies and best practices to ensure quality deliverables.\n\nI bring a proven track record of successful projects and a commitment to excellence. I am excited about the opportunity to contribute to your team's success.\n\nThank you for considering my application. I look forward to discussing how I can help achieve your goals.`,
                        proposedTerms: "1. Initial Consultation & Requirements Gathering\n2. Planning & Architecture Design\n3. Development Phase with Regular Check-ins\n4. Quality Assurance & Testing\n5. Review and Revisions\n6. Final Delivery & Documentation",
                        approach: "My approach focuses on:\n- Clear communication throughout the project\n- Agile methodology with iterative development\n- Regular progress updates and demos\n- Quality-first development with testing\n- Documentation and knowledge transfer",
                        timeline: "2-3 weeks",
                        budget: "50000",
                        paymentAmount: "50000",
                        paymentTerms: "50% upfront, 50% upon completion",
                        deadline: "3 weeks from project start",
                        validityPeriod: "30 days"
                    }
                };
            } else {
                // Contract mode
                return {
                    variables: {
                        partyA: "Service Provider",
                        partyB: "Client",
                        serviceDescription: "Professional services as outlined in the agreement",
                        paymentAmount: "TBD",
                        paymentTerms: "Net 30 days",
                        deliverables: "As specified in project scope",
                        timeline: "As agreed upon",
                        startDate: new Date().toISOString().split('T')[0],
                        endDate: "TBD",
                        terminationClause: "Either party may terminate with 30 days written notice",
                        jurisdiction: "To be specified",
                        validityPeriod: "12 months"
                    }
                };
            }
        } catch (e) {
            console.error('AI Service Error:', e);
            return { variables: {}, error: 'AI Service Unavailable. Please try again later.' };
        }
    }
};
