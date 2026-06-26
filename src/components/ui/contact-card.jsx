import React from 'react';
import { cn } from '../../lib/utils';
import { Plus } from 'lucide-react';

export function ContactCard({
	title = 'Contact With Us',
	description = 'If you have any questions regarding our Services or need help, please fill out the form here. We do our best to respond within 1 business day.',
	contactInfo,
	className,
	formSectionClassName,
	children,
	...props
}) {
	return (
		<div
			className={cn(
				'bg-white border relative grid h-full w-full shadow md:grid-cols-2 lg:grid-cols-3 rounded-xl overflow-hidden',
				className,
			)}
			{...props}
		>
			<Plus className="absolute -top-3 -left-3 h-6 w-6 text-slate-300" />
			<Plus className="absolute -top-3 -right-3 h-6 w-6 text-slate-300" />
			<Plus className="absolute -bottom-3 -left-3 h-6 w-6 text-slate-300" />
			<Plus className="absolute -right-3 -bottom-3 h-6 w-6 text-slate-300" />
			<div className="flex flex-col justify-between lg:col-span-2">
				<div className="relative h-full space-y-4 px-4 py-8 md:p-8">
					<h1 className="text-3xl font-bold md:text-4xl lg:text-5xl" style={{ color: "#0A1628" }}>
						{title}
					</h1>
					<p className="max-w-xl text-sm md:text-base lg:text-lg text-slate-600">
						{description}
					</p>
					<div className="grid gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
						{contactInfo?.map((info, index) => (
							<ContactInfo key={index} {...info} />
						))}
					</div>
				</div>
			</div>
			<div
				className={cn(
					'bg-slate-50 flex h-full w-full items-center border-t border-slate-200 p-5 md:col-span-1 md:border-t-0 md:border-l',
					formSectionClassName,
				)}
			>
				{children}
			</div>
		</div>
	);
}

function ContactInfo({
	icon: Icon,
	label,
	value,
	className,
	...props
}) {
	return (
		<div className={cn('flex items-center gap-3 py-3', className)} {...props}>
			<div className="bg-slate-100 rounded-lg p-3 text-slate-700">
				<Icon className="h-5 w-5" />
			</div>
			<div>
				<p className="font-medium text-slate-900">{label}</p>
				<p className="text-xs text-slate-600">{value}</p>
			</div>
		</div>
	);
}
