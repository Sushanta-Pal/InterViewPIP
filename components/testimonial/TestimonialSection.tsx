import Testimonial from './Testimonial';

export default function TestimonialSection() {
  const testimonials = [
    {
      quote: 'Voice Coach AI helped me ace my job interviews. The real-time feedback was a game-changer!',
      author: 'Sushant Pal',
      role: 'Software Engineer',
      avatar: '/image/sushant.png',
    },
    // Add more testimonials here
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Loved by Professionals Worldwide</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-8 max-w-2xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Testimonial key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
