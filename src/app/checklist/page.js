"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Assuming src/lib is aliased to @/lib

// This is the definition of your checklist structure from the frontend.
// It will be used to seed the database if items don't exist yet.
const DEFAULT_CHECKLIST_SECTIONS = [
    {
        id: "abonnements",
        title: "Abonnements",
        items: [
            { id: "eau", label: "Eau" },
            { id: "energie", label: "Énergie" },
            { id: "internet", label: "Internet" },
            { id: "telephone", label: "Téléphone" },
        ],
    },
    {
        id: "charges_copropriete",
        title: "Charges de copropriété",
        items: [{ id: "appel_fonds", label: "Appel de fonds" }],
    },
    {
        id: "assurances",
        title: "Assurances",
        items: [
            { id: "assurance_emprunteur", label: "Assurance emprunteur" },
            { id: "assurance_habitation_pno", label: "Assurance Habitation 'Propriétaire Non Occupant'" },
            { id: "autres_assurances", label: "Autres assurances" },
        ],
    },
    {
        id: "equipements_entretien",
        title: "Équipements et entretien",
        items: [
            { id: "autres_equipements", label: "Autres Équipements" },
            { id: "cuisine_equipee", label: "Cuisine équipée" },
            { id: "electromenager", label: "Électroménager" },
            { id: "entretien_reparations", label: "Entretien et réparations" },
            { id: "mobilier", label: "Mobilier" },
            { id: "travaux", label: "Travaux" },
        ],
    },
    {
        id: "autres_frais",
        title: "Autres frais",
        items: [
            { id: "adhesion_oga", label: "Adhésion à un OGA" },
            { id: "amendes_circulation", label: "Amendes de circulation" },
            { id: "autres_charges", label: "Autres charges" },
            { id: "autres_honoraires", label: "Autres honoraires" },
            { id: "depot_garantie_locataire", label: "Dépôt de garantie rendu au locataire" },
            { id: "documentation", label: "Documentation" },
            { id: "frais_comptabilite", label: "Frais de comptabilité (facture JD2M, ELM,…)" },
            { id: "frais_diagnostics", label: "Frais de diagnostics" },
            { id: "frais_tenue_compte", label: "Frais de tenue de compte" },
            { id: "frais_postaux", label: "Frais postaux" },
            { id: "honoraires_agence_conciergerie", label: "Honoraires agence / Conciergerie" },
            { id: "publicite", label: "Publicité" },
            { id: "seminaires_formations", label: "Séminaires et formations" },
        ],
    },
    {
        id: "frais_acquisition",
        title: "Frais d'acquisition",
        items: [
            { id: "commission_garantie_caution", label: "Commission garantie / caution" },
            { id: "decompte_notaire", label: "Décompte du notaire" },
            { id: "fond_mutuel_garantie", label: "Fond mutuel de garantie" },
        ],
    },
    {
        id: "frais_deplacement_reception",
        title: "Frais de déplacement et réception",
        items: [
            { id: "assurance_vehicule", label: "Assurance véhicule" },
            { id: "carburant", label: "Carburant" },
            { id: "entretien_vehicule", label: "Entretien véhicule" },
            { id: "hebergement", label: "Hébergement" },
            { id: "location_vehicule", label: "Location véhicule" },
            { id: "peage_parking", label: "Péage / parking" },
            { id: "restaurant", label: "Restaurant" },
            { id: "train_avion", label: "Train ou avion" },
        ],
    },
    {
        id: "salaire",
        title: "Salaire",
        items: [{ id: "salaires", label: "Salaires" }],
    },
    {
        id: "impots_taxes",
        title: "Impôts et taxes",
        items: [
            { id: "autres_impots_taxes", label: "Autres impôts et taxes" },
            { id: "csg", label: "CSG" },
            { id: "cfe", label: "CFE" },
            { id: "droits_donation", label: "Droits de donation" },
            { id: "droits_succession", label: "Droits de succession" },
            { id: "impot_revenu_ir", label: "Impôt sur le revenu (IR)" },
            { id: "pfac", label: "PFAC" },
            { id: "plus_value_immobiliere", label: "Plus-value immobilière" },
            { id: "redevance_tv", label: "Redevance TV" },
            { id: "taxe_amenagement", label: "Taxe d'aménagement" },
            { id: "taxe_assainissement", label: "Taxe d'assainissement" },
            { id: "taxe_habitation", label: "Taxe d'habitation" },
            { id: "taxe_sejour", label: "Taxe de séjour" },
            { id: "taxe_fonciere", label: "Taxe foncière" },
            { id: "taxe_petites_surfaces", label: "Taxe petites surfaces (234 CGI)" },
            { id: "tlv", label: "TLV" },
        ],
    },
    {
        id: "sous_location",
        title: "Sous-location",
        items: [{ id: "sous_location_item", label: "Sous-location" }],
    },
];

export default function ChecklistPage() {
    const [checklistSections, setChecklistSections] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Function to merge DB state with default structure
    const mergeWithDefaultStructure = useCallback((dbItems) => {
        return DEFAULT_CHECKLIST_SECTIONS.map(section => ({
            ...section,
            items: section.items.map(item => {
                const dbItem = dbItems.find(d => d.section_id === section.id && d.item_id === item.id);
                return { ...item, checked: dbItem ? dbItem.is_checked : false };
            })
        }));
    }, []);

    // Fetch initial data and seed if necessary
    const fetchAndSeedData = useCallback(async () => {
        setIsLoading(true);
        const { data: dbItems, error: fetchError } = await supabase
            .from('checklist_item_states')
            .select('section_id, item_id, is_checked');

        if (fetchError) {
            console.error('Error fetching checklist items:', fetchError);
            // Potentially set an error state to show in UI
            setChecklistSections(mergeWithDefaultStructure([])); // Fallback to default structure
            setIsLoading(false);
            return;
        }

        // Identify items in DEFAULT_CHECKLIST_SECTIONS not in dbItems
        const itemsToSeed = [];
        DEFAULT_CHECKLIST_SECTIONS.forEach(section => {
            section.items.forEach(item => {
                if (!dbItems.find(dbItem => dbItem.section_id === section.id && dbItem.item_id === item.id)) {
                    itemsToSeed.push({ section_id: section.id, item_id: item.id, is_checked: false });
                }
            });
        });

        if (itemsToSeed.length > 0) {
            const { error: seedError } = await supabase
                .from('checklist_item_states')
                .insert(itemsToSeed, { upsert: true }); // Use upsert to avoid errors if item was created by another client simultaneously

            if (seedError) {
                console.error('Error seeding checklist items:', seedError);
            } else {
                // Re-fetch after seeding to ensure consistency or merge locally
                const { data: updatedDbItems, error: postSeedFetchError } = await supabase
                    .from('checklist_item_states')
                    .select('section_id, item_id, is_checked');
                if (postSeedFetchError) console.error('Error fetching after seed:', postSeedFetchError);
                setChecklistSections(mergeWithDefaultStructure(updatedDbItems || dbItems));
            }
        } else {
            setChecklistSections(mergeWithDefaultStructure(dbItems));
        }
        setIsLoading(false);
    }, [mergeWithDefaultStructure]);

    useEffect(() => {
        fetchAndSeedData();

        // Set up Supabase real-time subscription
        const channel = supabase
            .channel('checklist_updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'checklist_item_states' },
                (payload) => {
                    // console.log('Change received!', payload);
                    // When a change is received, update the specific item in our local state
                    const { new: newItemState, old: oldItemState, eventType } = payload;

                    setChecklistSections(prevSections =>
                        prevSections.map(section => {
                            if ((eventType === 'UPDATE' || eventType === 'INSERT') && newItemState && section.id === newItemState.section_id) {
                                return {
                                    ...section,
                                    items: section.items.map(item =>
                                        item.id === newItemState.item_id
                                            ? { ...item, checked: newItemState.is_checked }
                                            : item
                                    ),
                                };
                            } else if (eventType === 'DELETE' && oldItemState && section.id === oldItemState.section_id) {
                                // If you implement delete, handle it here by potentially resetting or removing
                                // For now, we assume items are not deleted from the DB by users, only checked/unchecked
                                // Or, if an item were to be deleted from DEFAULT_CHECKLIST_SECTIONS and its DB record removed:
                                return {
                                    ...section,
                                    items: section.items.map(item =>
                                        item.id === oldItemState.item_id
                                            ? { ...item, checked: false } // Reset to unchecked if deleted
                                            : item
                                    ),
                                };
                            }
                            return section;
                        })
                    );
                }
            )
            .subscribe();

        // Cleanup subscription on component unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchAndSeedData]);

    const handleCheckboxChange = async (sectionId, itemId, currentCheckedStatus) => {
        const newCheckedStatus = !currentCheckedStatus;

        // Optimistically update UI - this makes the UI feel faster
        setChecklistSections(prevSections =>
            prevSections.map(section =>
                section.id === sectionId
                    ? {
                        ...section,
                        items: section.items.map(item =>
                            item.id === itemId ? { ...item, checked: newCheckedStatus } : item
                        ),
                    }
                    : section
            )
        );

        // Update the database
        // We use upsert here: if the item somehow wasn't seeded, this will create it.
        // The unique constraint (section_id, item_id) in the DB is important.
        const { error } = await supabase
            .from('checklist_item_states')
            .upsert({ section_id: sectionId, item_id: itemId, is_checked: newCheckedStatus },
                { onConflict: 'section_id, item_id' });

        if (error) {
            console.error('Error updating checklist item:', error);
            // Revert optimistic update if DB update fails
            setChecklistSections(prevSections =>
                prevSections.map(section =>
                    section.id === sectionId
                        ? {
                            ...section,
                            items: section.items.map(item =>
                                item.id === itemId ? { ...item, checked: currentCheckedStatus } : item // Revert to original
                            ),
                        }
                        : section
                )
            );
            // Optionally show an error message to the user
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-xl text-gray-700">Loading checklist...</p>
                {/* You could add a spinner here */}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <main className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-12">
                    Checklist des Dépenses Immobilières
                </h1>

                <div className="space-y-10">
                    {checklistSections.map((section) => (
                        <section key={section.id} className="bg-white shadow-xl rounded-lg p-6">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">
                                {section.title}
                            </h2>
                            <ul className="space-y-4">
                                {section.items.map((item) => (
                                    <li key={item.id} className="flex items-center">
                                        <input
                                            id={`${section.id}-${item.id}`}
                                            name={`${section.id}-${item.id}`}
                                            type="checkbox"
                                            checked={item.checked || false} // Ensure checked is always boolean
                                            onChange={() => handleCheckboxChange(section.id, item.id, item.checked)}
                                            className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 transition duration-150 ease-in-out cursor-pointer"
                                        />
                                        <label
                                            htmlFor={`${section.id}-${item.id}`}
                                            className={`ml-3 block text-md font-medium cursor-pointer ${item.checked ? 'text-gray-500 line-through' : 'text-gray-700'}`}
                                        >
                                            {item.label}
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
                <footer className="mt-16 text-center text-gray-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} Gestion Immobilière Simplifiée. Tous droits réservés.</p>
                </footer>
            </main>
        </div>
    );
} 