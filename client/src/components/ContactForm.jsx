import { useRef } from 'react';
import emailjs from 'emailjs-com';

export default function ContactForm() {
    const form = useRef();

    const sendEmail = (e) => {
        e.preventDefault();

        emailjs
            .sendForm(
                'service_2uoz0ku',
                'template_q87xbi9',
                form.current,
                'fd8itstERdrCcdZLZ'
            )
            .then(
                (result) => {
                    console.log('Email sent:', result.text);
                    alert('Your message has been sent successfully!');
                },
                (error) => {
                    console.error('Error sending email:', error.text);
                    alert('There was an error sending your message. Please try again later.');
                }
            );
    };

    return (
        <form ref={form} onSubmit={sendEmail}>
            <input type="text" name="name" placeholder="Name" required />
            <input type="text" name="title" placeholder="Subject" required />
            <textarea name="message" placeholder="Message" required />
            <button type="submit">Send</button>
        </form>
    );
}
