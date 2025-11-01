import React from 'react';
import { getInstagramPosts } from '../constants';
import { useTranslation } from '../contexts/LanguageContext';

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.85s.011-3.584.069-4.85c.149-3.225 1.664-4.771 4.919-4.919C8.416 2.175 8.796 2.163 12 2.163zm0 1.8a5.16 5.16 0 100 10.32 5.16 5.16 0 000-10.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"/>
    </svg>
);

const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-1.383-.597c-2.85-1.54-4.63-4.49-4.63-7.92V9.75a6 6 0 016-6c2.19 0 4.144 1.22 5.25 3.033C15.856 4.97 17.81 3.75 20 3.75a6 6 0 016 6v.75c0 3.43-1.78 6.38-4.63 7.92a15.247 15.247 0 01-1.383.597l-.022.012-.007.003h-.001a.75.75 0 01-.708 0l.003-.001z" />
    </svg>
);

const ChatBubbleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-7.152.52 48.9 48.9 0 01-7.152-.52c-1.978-.292-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.678 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
    </svg>
);


const GallerySection: React.FC = () => {
    const { t } = useTranslation();
    const instagramPosts = getInstagramPosts(t);

    return (
        <section className="py-24 bg-slate-50">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <h2 className="text-4xl font-extrabold text-slate-900 font-serif">{t('gallery.title')}</h2>
                    <p className="text-lg text-slate-600 mt-2">{t('gallery.subtitle')}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {instagramPosts.map((post) => (
                        <div key={post.id} className="group relative block w-full aspect-square overflow-hidden rounded-xl shadow-lg">
                            <img src={post.src} alt={post.alt} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500 ease-in-out" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute inset-0 flex flex-col justify-end p-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <p className="text-sm font-light leading-relaxed mb-4">{post.caption}</p>
                                <div className="flex items-center text-sm font-medium">
                                    <HeartIcon className="w-5 h-5 mr-1" />
                                    <span>{post.likes}</span>
                                    <ChatBubbleIcon className="w-5 h-5 ml-4 mr-1" />
                                    <span>{post.comments}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="text-center mt-16">
                     <a href="https://www.instagram.com/gwimake/" target="_blank" rel="noopener noreferrer" 
                        className="inline-flex items-center gap-3 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-8 rounded-lg text-lg shadow-lg hover:shadow-slate-900/40 transition-all duration-300 transform hover:scale-105">
                        <InstagramIcon className="w-6 h-6" />
                        {t('gallery.button')}
                    </a>
                </div>
            </div>
        </section>
    );
};

export default GallerySection;