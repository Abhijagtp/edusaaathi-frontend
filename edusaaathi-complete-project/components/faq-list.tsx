const faqs = [
  {
    question: "How do I choose a course that suits me?",
    answer: "Start with the subjects and activities you enjoy, the kind of work you want to explore and the study options available to you. Edusaaathi can help you compare course details and understand what to check before deciding.",
  },
  {
    question: "How can I check whether I am eligible?",
    answer: "Eligibility can vary by institution, intake and admission route. Review the latest official course information for the institutions you are considering, and use Edusaaathi to help you understand the requirements.",
  },
  {
    question: "Can I ask about duration, fees and admissions?",
    answer: "Yes. Send an enquiry with the course you are interested in and we can help you understand what information to review. Fees, dates and requirements should always be confirmed with the institution.",
  },
  {
    question: "How do I contact Edusaaathi?",
    answer: "Use the enquiry form on this page or the WhatsApp link. Share your name, mobile number and the course you would like to explore so we can understand your question.",
  },
];

export function FaqList() {
  return (
    <div className="faq-list">
      {faqs.map((faq, index) => (
        <details className="faq-item" key={faq.question} data-reveal>
          <summary><span className="faq-item__number">0{index + 1}</span><span>{faq.question}</span><span className="faq-item__toggle" aria-hidden="true" /></summary>
          <div className="faq-item__answer"><p>{faq.answer}</p></div>
        </details>
      ))}
    </div>
  );
}
