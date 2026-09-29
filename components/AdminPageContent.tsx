"use client";
import Form from "next/form";
import AdminPageNavBar from "./AdminPageNavBar";
import { PageType } from "@/types/pageType";

export default function AdminPageContent({
    searchElement,
    contentElement,
    sortElement,
    pageType,
}: {
    searchElement: React.ReactNode;
    contentElement: React.ReactNode;
    sortElement: React.ReactNode;
    pageType: PageType;
}) {
    return (
        <div className="font-admin flex h-dvh flex-col">
            <AdminPageNavBar page={pageType} />
            <div className="border-y border-white md:hidden" />
            <div className="flex h-full flex-col items-center justify-center">
                <div className="bg-lighter flex h-full w-full flex-col md:h-3/4 md:w-3xl md:rounded-xl lg:w-4xl xl:w-6xl">
                    <Form
                        className="bg-light flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between md:rounded-t-xl"
                        action={() => {}}
                    >
                        <div className="flex flex-col items-stretch justify-start gap-5 md:flex-8 md:flex-row">
                            {searchElement}
                        </div>
                    </Form>
                    {sortElement}
                    <div className="w-full overflow-y-scroll">
                        {contentElement}
                    </div>
                </div>
            </div>
        </div>
    );
}
