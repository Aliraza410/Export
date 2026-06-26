import React from 'react';

export function MinimalFooter() {
	const year = new Date().getFullYear();

	const company = [
		{ title: 'About Us', href: '#' },
		{ title: 'Blog', href: '#' },
		{ title: 'Careers', href: '#' },
		{ title: 'Contact', href: '#' },
	];

	const platform = [
		{ title: 'Dashboard', href: '#' },
		{ title: 'Documents', href: '#' },
		{ title: 'Cost Estimator', href: '#' },
		{ title: 'Insights', href: '#' },
	];

    const legal = [
		{ title: 'Privacy Policy', href: '#' },
		{ title: 'Terms of Service', href: '#' },
		{ title: 'Cookies', href: '#' },
    ];



	return (
		<footer className="relative bg-black border-t border-slate-700 text-white">
			<div className="mx-auto max-w-5xl md:border-x border-slate-700">
				<div className="grid max-w-5xl grid-cols-6 gap-6 p-8">
					<div className="col-span-6 flex flex-col gap-5 md:col-span-3">
						<a href="#" className="w-max text-white flex items-center gap-2">
                            <span className="font-extrabold text-xl tracking-tight">EXPORT EASE</span>
						</a>
						<p className="text-slate-400 max-w-sm text-sm text-balance leading-relaxed">
							Smart export guidance for businesses entering global markets. We simplify your entire export journey.
						</p>

					</div>
					<div className="col-span-2 w-full md:col-span-1">
						<span className="text-white font-semibold mb-3 block text-sm">
							Platform
						</span>
						<div className="flex flex-col gap-2">
							{platform.map(({ href, title }, i) => (
								<a
									key={i}
									className="w-max text-sm text-slate-400 hover:text-white transition-colors"
									href={href}
								>
									{title}
								</a>
							))}
						</div>
					</div>
					<div className="col-span-2 w-full md:col-span-1">
						<span className="text-white font-semibold mb-3 block text-sm">Company</span>
						<div className="flex flex-col gap-2">
							{company.map(({ href, title }, i) => (
								<a
									key={i}
									className="w-max text-sm text-slate-400 hover:text-white transition-colors"
									href={href}
								>
									{title}
								</a>
							))}
						</div>
					</div>
                    <div className="col-span-2 w-full md:col-span-1">
						<span className="text-white font-semibold mb-3 block text-sm">Legal</span>
						<div className="flex flex-col gap-2">
							{legal.map(({ href, title }, i) => (
								<a
									key={i}
									className="w-max text-sm text-slate-400 hover:text-white transition-colors"
									href={href}
								>
									{title}
								</a>
							))}
						</div>
					</div>
				</div>
				<div className="bg-slate-700 h-px w-full" />
				<div className="flex max-w-5xl flex-col items-center justify-between gap-2 py-6 px-8 sm:flex-row">
					<p className="text-slate-400 text-sm font-medium">
						© {year} EXPORT EASE. All rights reserved.
					</p>
                    <p className="text-slate-500 text-sm">
                        Made with ❤️ for exporters
                    </p>
				</div>
			</div>
		</footer>
	);
}
