import React from "react";

const TestimonialSection = () => {
  const cardsData = [
    {
      image: "/image/sushant.png",
      name: "Sushanta Pal",
      handle: "@obito",
      date: "August 03, 2025",
      feedback: "VoiceCoach was a game-changer for my final rounds. The AI feedback on my speech clarity was incredibly detailed and helped me land the offer.",
    },
    {
      image: "/image/suman.jpeg",
      name: "Suman Kumar Roy",
      handle: "@khushi",
      date: "August 10, 2025",
      feedback: "The technical mock interviews were tougher than the real thing! I felt so much more prepared and confident going into my on-site interviews.",
    },
    {
      image: "/image/akash.jpeg",
      name: "Akash Mishra",
      handle: "@soumili",
      date: "August 5, 2025",
      feedback: "I used to be so nervous about presenting my portfolio. Practicing with VoiceCoach helped me calm my nerves and communicate my design decisions effectively.",
    },
    {
      image: "/image/subho.jpeg",
      name: "Subhajit Pramanick",
      handle: "@subho",
      date: "August 1, 2025",
      feedback: "The progress dashboard is fantastic. Seeing my average score improve over time was a huge motivator.",
    },
  ];

  const CreateCard = ({ card }: { card: typeof cardsData[0] }) => (
    <div className="p-4 rounded-lg mx-4 shadow hover:shadow-lg transition-all duration-200 w-80 shrink-0 border bg-white dark:bg-slate-900">
      <div className="flex gap-3 items-center">
        <img
          className="size-12 rounded-full object-cover border-2 border-blue-200 dark:border-blue-800"
          src={card.image}
          alt={`${card.name}'s profile picture`}
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {card.name}
            </p>
          </div>
          <span className="text-sm text-slate-500">{card.handle}</span>
        </div>
      </div>
      <p className="text-base py-4 text-gray-700 dark:text-gray-300">
        "{card.feedback}"
      </p>
    </div>
  );

  return (
    <section id="testimonials" className="w-full py-20 md:py-28 bg-white dark:bg-slate-950">
      <style>{`
        @keyframes marqueeScroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .marquee-inner {
          animation: marqueeScroll 40s linear infinite;
        }
        .marquee-row:hover .marquee-inner {
          animation-play-state: paused;
        }
      `}</style>
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
          Loved by Professionals
        </h2>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          Hear what our users have to say about their success.
        </p>
      </div>
      <div className="relative flex flex-col gap-y-6 overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-20 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent dark:from-slate-950"></div>
        <div className="absolute right-0 top-0 h-full w-20 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent dark:from-slate-950"></div>
        <div className="marquee-row w-full">
          <div className="marquee-inner flex transform-gpu min-w-max">
            {[...cardsData, ...cardsData].map((card, index) => (
              <CreateCard key={`row1-${index}`} card={card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;